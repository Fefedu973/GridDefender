import type { NextConfig } from "next";

const repositoryName = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "GridDefender";
const isGithubPagesBuild = process.env.GITHUB_PAGES === "true";
const isUserPagesRepository = repositoryName.toLowerCase().endsWith(".github.io");
const pagesBasePath = isGithubPagesBuild && !isUserPagesRepository ? `/${repositoryName}` : "";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath: pagesBasePath || undefined,
  assetPrefix: pagesBasePath ? `${pagesBasePath}/` : undefined,
  images: {
    unoptimized: true,
  },
  transpilePackages: ["three"],
};

export default nextConfig;
