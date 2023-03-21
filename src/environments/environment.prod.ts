export const environment = {
  production: true,
  schema: {
    video: {
      query: `
        CREATE TABLE IF NOT EXISTS video(
          name TEXT NOT NULL,
          path TEXT NOT NULL,
          url TEXT NOT NULL,
          ctime INTEGER,
          mtime INTEGER,
          size INTEGER,
          thumbnailPath TEXT,
          thumbnailUrl TEXT
        )
      `,
      version: 1
    }
  }
};
