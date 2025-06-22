<h1>Plexer</h1>
<p>
  <a href="https://github.com/eliasthecactus/Plexer#readme" target="_blank">
    <img alt="Documentation" src="https://img.shields.io/badge/documentation-yes-brightgreen.svg" />
  </a>
  <a href="https://github.com/eliasthecactus/Plexer/graphs/commit-activity" target="_blank">
    <img alt="Maintenance" src="https://img.shields.io/badge/Maintained%3F-yes-green.svg" />
  </a>
  <img alt="Version: v1.0.0-alpha1" src="https://img.shields.io/badge/version-v1.0.0--alpha1-blue" />
  <a href="https://github.com/eliasthecactus/Plexer/blob/master/LICENSE" target="_blank">
    <img alt="License: MIT" src="https://img.shields.io/github/license/eliasthecactus/Plexer" />
  </a>
</p>

> 😋 A Website which helps you to download original files from a plex share (even if you're not allowed to download)



## Usage
Plex has recently changed how some of its resources are served.
Due to CORS restrictions, some features no longer work when running Plexer from GitHub Pages — like direct communication with Plex servers.

This is expected behavior when using HTTPS GitHub-hosted frontend (e.g. https://eliasthecactus.github.io/plexer) to access private or local Plex servers.

You can still use Plexer fully by running it locally via Docker, where CORS isn’t a problem.

### Usage Options

1. GitHub Pages (HTTPS only)
- Visit: https://eliasthecactus.github.io/plexer/browse
- Requires your Plex server to be publicly accessible via HTTPS and CORS-compliant (e.g., using a reverse proxy).

2. Custom HTTP/HTTPS Deployment
- Visit: http://plexer.apps.elias.uno
- Your browser might block requests depending on the CORS policies of your Plex server.

3. Local Docker Deployment (Recommended)
```bash
docker run --name plexer -p 8080:80 ghcr.io/eliasthecactus/plexer:latest
```
Then open:
(http://localhost:8080)[http://localhost:8080] (for HTTP)


## 📃 ToDo
- [x] start with project
- [x] make it work
- [x] Add JDownloader suppot for mass download (added link list which can be copied to jdownloader)
- [x] Rewrite in Angular


## Author
👤 **elias**
* Github: [@eliasthecactus](https://github.com/eliasthecactus)


## 🤝 Contributing
Contributions, issues and feature requests are welcome!<br />Feel free to check [issues page](https://github.com/eliasthecactus/Plexer/issues).


## Show your support
Give a ⭐️ if this project helped you!


## 📝 License
[Copyright](https://github.com/eliasthecactus/Plexer/blob/master/LICENSE) © 20225 [eliasthecactus](https://github.com/eliasthecactus)
