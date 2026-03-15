module.exports = {
  apps: [
    {
      name: "spg-web",
      cwd: "/root/social-post-gen/apps/web",
      script: "/bin/bash",
      args: [
        "-lc",
        "cd /root/social-post-gen/apps/web && ./node_modules/.bin/next start --hostname 127.0.0.1 --port 3000"
      ],
      env: {
        NODE_ENV: "production",
        NODE_OPTIONS: "--dns-result-order=ipv4first"
      }
    }
  ]
}
