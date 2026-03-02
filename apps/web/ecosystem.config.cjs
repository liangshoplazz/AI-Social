module.exports = {
  apps: [
    {
      name: "spg-web",
      cwd: "/root/social-post-gen/apps/web",
      script: "node_modules/next/dist/bin/next",
      args: "dev --hostname 127.0.0.1 --port 3000",
      env: {
        NODE_ENV: "development",
        NODE_OPTIONS: "--dns-result-order=ipv4first"
      }
    }
  ]
}
