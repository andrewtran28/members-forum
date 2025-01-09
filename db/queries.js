const pool = require("./pool");

const checkGameImages = async () => {
  const { rows } = await pool.query(`
    SELECT game_id, title, img_url
    FROM games
  `);

  // Loop through each game and check if img_url is empty
  for (const game of rows) {
    if (!game.img_url || game.img_url.trim() === '') {
      let imageData = await fetchGameImages(game.title);
      await updateGameImages(game.game_id, imageData.small_url, imageData.thumb_url);
    }
  }
}

const fetchGameImages = async (gameName) => {
  try {
    const response = await fetch(`https://www.giantbomb.com/api/search/?api_key=${process.env.GAMEBOMB_API}&format=json&query=${gameName}&resources=game`);
    const data = await response.json();
    console.log("GameBomb API fetched.");
    
    //If no suitable GameBomb image can be found, use a placeholder.
    if (data.results == "") {
      return {
        "small_url": "/game.png",
        "thumb_url": "/game.png"
      }
    }
    return data.results[0].image;
  } catch (error) {
    console.error('Error :', error);
  }
};

const updateGameImages = async (id, image, thumb) => {
  await pool.query(`
    UPDATE games
    SET img_url = $2,
      thumb_url = $3
    WHERE game_id = $1
    `, [id, image, thumb]);
};

const getAllGames = async () => {
  const { rows } = await pool.query(`
    SELECT
      g.title,
      g.game_id,
      g.img_url,
      g.thumb_url,
      ge.genre_name,
      STRING_AGG(p.platform_name, ', ' ORDER BY 
        CASE 
          WHEN p.platform_name = 'Other' THEN 1 
          ELSE 0 
        END, 
        p.platform_name) AS platforms
    FROM games g
    LEFT JOIN genres ge ON g.genre_id = ge.genre_id
    LEFT JOIN game_platforms gp ON g.game_id = gp.game_id
    LEFT JOIN platforms p ON gp.platform_id = p.platform_id
    GROUP BY g.game_id, ge.genre_name
    ORDER BY g.title;
  `);

  return rows;
}

const getGamesByPlatform = async (platform) => {
    // Query to find all games available on the given platform
    const platformGames = await pool.query(`
      SELECT
        g.title,
        g.game_id
      FROM games g
      JOIN game_platforms gp ON g.game_id = gp.game_id
      JOIN platforms p ON gp.platform_id = p.platform_id
      WHERE p.platform_name = $1`, [platform]);

    // Extract game IDs from the result
    const gameIds = platformGames.rows.map(row => row.game_id);

    // Query to get detailed information about the games
    const { rows } = await pool.query(`
      SELECT 
        g.title,
        g.game_id,
        g.img_url,
        g.thumb_url,
        ge.genre_name,
        STRING_AGG(p.platform_name, ', ' ORDER BY 
          CASE 
            WHEN p.platform_name = 'Other' THEN 1 
            ELSE 0 
          END, 
          p.platform_name) AS platforms
      FROM games g
      LEFT JOIN genres ge ON g.genre_id = ge.genre_id
      LEFT JOIN game_platforms gp ON g.game_id = gp.game_id
      LEFT JOIN platforms p ON gp.platform_id = p.platform_id
      WHERE g.game_id = ANY($1)
      GROUP BY g.game_id, ge.genre_name
      ORDER BY g.title;
    `, [gameIds]);

    return rows;
};

const getGamesByGenre = async (genre) => {

  const { rows } = await pool.query(`
    SELECT 
      g.title, 
      g.game_id,
      g.img_url,
      g.thumb_url,
      ge.genre_name,
      STRING_AGG(p.platform_name, ', ' ORDER BY 
        CASE 
          WHEN p.platform_name = 'Other' THEN 1 
          ELSE 0 
        END, 
        p.platform_name) AS platforms
    FROM games g
    JOIN genres ge ON g.genre_id = ge.genre_id
    JOIN game_platforms gp ON g.game_id = gp.game_id
    JOIN platforms p ON gp.platform_id = p.platform_id
    WHERE ge.genre_name = $1
    GROUP BY g.game_id, ge.genre_name;
  `, [genre]);

  return rows;
}

const getGameById = async (gameId) => {
  const { rows } = await pool.query(`
    SELECT 
      g.title,
      g.game_id,
      g.img_url,
      ge.genre_name AS genre,
      STRING_AGG(p.platform_name, ', ' ORDER BY 
        CASE 
          WHEN p.platform_name = 'Other' THEN 1 
          ELSE 0 
        END, 
        p.platform_name) AS platforms
    FROM games g
    LEFT JOIN genres ge ON g.genre_id = ge.genre_id
    LEFT JOIN game_platforms gp ON g.game_id = gp.game_id
    LEFT JOIN platforms p ON gp.platform_id = p.platform_id
    WHERE g.game_id = $1
    GROUP BY g.game_id, ge.genre_name;
  `, [gameId]);

  return rows;
}

const getDistinctPlatforms = async () => {
  const { rows } = await pool.query(`
    SELECT * FROM platforms
    ORDER BY CASE
      WHEN platform_name = 'Other' THEN 1
      ELSE 0
    END, platform_name;
  `);
  
  return rows;
}

const getDistinctGenres =  async () => {
  const { rows } = await pool.query(`
    SELECT * FROM genres
    ORDER BY CASE
      WHEN genre_name = 'Other' THEN 1
      ELSE 0
    END, genre_name;
  `);

  return rows;
}

const addGame = async (name, platforms, genre, image) => {
  // Insert the genre if it doesn't exist and get its ID
  const genreResult = await pool.query(`
    WITH genre_insert AS (
      INSERT INTO genres (genre_name)
      SELECT CAST($1 AS VARCHAR)
      WHERE NOT EXISTS (SELECT 1 FROM genres WHERE genre_name = CAST($1 AS VARCHAR))
      RETURNING genre_id
    )
    SELECT genre_id FROM genre_insert
    UNION ALL
    SELECT genre_id FROM genres WHERE genre_name = CAST($1 AS VARCHAR);`,
    [genre]
  );
  const genreId = genreResult.rows[0].genre_id;

  // Insert the game and get its ID
  const gameResult = await pool.query(`
    INSERT INTO games (title, img_url, genre_id)
    VALUES ($1, $2, $3)
    RETURNING game_id;`,
    [name, image, genreId]
  );

  const gameId = gameResult.rows[0].game_id;

  // Insert platforms if they don't exist and get their IDs
  const platformIds = [];
  for (const platform of platforms) {
    const platformResult = await pool.query(`
      WITH platform_insert AS (
        INSERT INTO platforms (platform_name)
        SELECT CAST($1 AS VARCHAR)
        WHERE NOT EXISTS (SELECT 1 FROM platforms WHERE platform_name = CAST($1 AS VARCHAR))
        RETURNING platform_id
      )
      SELECT platform_id FROM platform_insert
      UNION ALL
      SELECT platform_id FROM platforms WHERE platform_name = CAST($1 AS VARCHAR);`,
      [platform]
    );
    platformIds.push(platformResult.rows[0].platform_id);
  }

  // Associate the game with the platforms
  for (const platformId of platformIds) {
    await pool.query(
      `INSERT INTO game_platforms (game_id, platform_id)
      VALUES ($1, $2);`,
      [gameId, platformId]
    );
  }

  //Update game image and thumbnail
  let imageData = await fetchGameImages(name);
  await updateGameImages(gameId, imageData.small_url, imageData.thumb_url);
}

const updateGame = async (id, name, platforms, genre, image) => {
  // Ensure the genre exists
  let genreId;
  const genreCheckQuery = `SELECT genre_id FROM genres WHERE genre_name = $1`;
  const genreCheckResult = await pool.query(genreCheckQuery, [genre]);

  if (genreCheckResult.rows.length > 0) {
    genreId = genreCheckResult.rows[0].genre_id;
  } else {
    const insertGenreQuery = `INSERT INTO genres (genre_name) VALUES ($1) RETURNING genre_id`;
    const genreInsertResult = await pool.query(insertGenreQuery, [genre]);
    genreId = genreInsertResult.rows[0].genre_id;
  }

  // Update the game's title, genre, and image
  await pool.query(`
    UPDATE games
    SET 
      title = $1,
      genre_id = $2,
      img_url = $3
    WHERE game_id = $4
  `, [name, genreId, image, id]);

  // Ensure all platforms exist
  const platformIds = [];
  for (const platform of platforms) {
    const platformCheckResult = await pool.query(`SELECT platform_id FROM platforms WHERE platform_name = $1`, [platform]);

    if (platformCheckResult.rows.length > 0) {
      platformIds.push(platformCheckResult.rows[0].platform_id);
    } else {
      const platformInsertResult = await pool.query(`INSERT INTO platforms (platform_name) VALUES ($1) RETURNING platform_id`, [platform]);
      platformIds.push(platformInsertResult.rows[0].platform_id);
    }
  }

  // Clear existing platforms for the game
  await pool.query(`DELETE FROM game_platforms WHERE game_id = $1`, [id]);

  // Insert new platforms
  for (const platformId of platformIds) {
    await pool.query(`INSERT INTO game_platforms (game_id, platform_id) VALUES ($1, $2)`, [id, platformId]);
  }

  //Update game image and thumbnail
  let imageData = await fetchGameImages(name);
  await updateGameImages(id, imageData.small_url, imageData.thumb_url);

  purgeEmptyCategories();
};

const deletePlatform = async (platform) => {
    // Check if there are any games where the given platform is the only platform
    const gameCheckResult = await pool.query(`
      SELECT game_id 
       FROM game_platforms 
       WHERE platform_id = (SELECT platform_id FROM platforms WHERE platform_name = $1)
       GROUP BY game_id
       HAVING COUNT(platform_id) = 1;`,
      [platform]
    );

    // If there are games where the platform is the only one, reassign them to 'Other'
    if (gameCheckResult.rows.length > 0) {
      const gameIds = gameCheckResult.rows.map(row => row.game_id);
      
      // First, check if 'Other' exists, if not, insert it
      const otherPlatformResult = await pool.query(`SELECT platform_id FROM platforms WHERE platform_name = 'Other';`);
      
      let otherPlatformId;
      if (otherPlatformResult.rows.length === 0) {
        // Insert 'Other' platform if it doesn't exist
        const insertOtherResult = await pool.query(
          `INSERT INTO platforms (platform_name) 
           VALUES ('Other') 
           RETURNING platform_id;`
        );
        otherPlatformId = insertOtherResult.rows[0].platform_id;
      } else {
        otherPlatformId = otherPlatformResult.rows[0].platform_id;
      }

      // Update these games to be associated with the 'Other' platform
      for (const gameId of gameIds) {
        await pool.query(
          `UPDATE game_platforms
           SET platform_id = $1
           WHERE game_id = $2 AND platform_id = (SELECT platform_id FROM platforms WHERE platform_name = $3);`,
          [otherPlatformId, gameId, platform]
        );
      }
    }

    purgeEmptyCategories();
}

const deleteGenre = async (genre) => {
  // Check if there are any games where the given genre is the only genre
  const gameCheckResult = await pool.query(`
    SELECT game_id 
      FROM games 
      WHERE genre_id = (SELECT genre_id FROM genres WHERE genre_name = $1)
      GROUP BY game_id
      HAVING COUNT(genre_id) = 1;`,
    [genre]
  );

  // If there are games where the genre is the only one, reassign them to 'Other'
  if (gameCheckResult.rows.length > 0) {
    const gameIds = gameCheckResult.rows.map(row => row.game_id);

    // First, check if 'Other' genre exists, if not, insert it
    const otherGenreResult = await pool.query(`SELECT genre_id FROM genres WHERE genre_name = 'Other';`);

    let otherGenreId;
    if (otherGenreResult.rows.length === 0) {
      // Insert 'Other' genre if it doesn't exist
      const insertOtherResult = await pool.query(
        `INSERT INTO genres (genre_name) 
          VALUES ('Other') 
          RETURNING genre_id;`
      );
      otherGenreId = insertOtherResult.rows[0].genre_id;
    } else {
      otherGenreId = otherGenreResult.rows[0].genre_id;
    }

    // Update these games to be associated with the 'Other' genre
    for (const gameId of gameIds) {
      await pool.query(`
        UPDATE games
          SET genre_id = $1
          WHERE game_id = $2 AND genre_id = (SELECT genre_id FROM genres WHERE genre_name = $3);`,
        [otherGenreId, gameId, genre]
      );
    }
  }

  purgeEmptyCategories();
}

const deleteGameById = async (id) => {
  await pool.query(`
    WITH deleted_platforms AS (
      DELETE FROM game_platforms
      WHERE game_id = $1
      RETURNING platform_id
    )
    DELETE FROM games
    WHERE game_id = $1;
  `, [id]);

  purgeEmptyCategories();
}

const purgeEmptyCategories = async () => {
  // Clean up platforms not associated with any games
  await pool.query(`
    DELETE FROM platforms
    WHERE platform_id NOT IN (
      SELECT DISTINCT platform_id
      FROM game_platforms
    );
  `);

  // Clean up genres not associated with any games
  await pool.query(`
    DELETE FROM genres
    WHERE genre_id NOT IN (
      SELECT DISTINCT genre_id
      FROM games
    );
  `);
}

module.exports = {
  checkGameImages,
  getAllGames,
  getGamesByPlatform,
  getGamesByGenre,
  getGameById,
  addGame,
  updateGame,
  getDistinctPlatforms,
  getDistinctGenres,
  deletePlatform,
  deleteGenre,
  deleteGameById,
};