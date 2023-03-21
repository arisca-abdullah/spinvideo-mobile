export type Video = {
  name: string;
  path: string;
  url: string;
  ctime?: number;
  mtime: number;
  size: number;
  thumbnailPath?: string;
  thumbnailUrl?: string;
};
