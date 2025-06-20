import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { PlexAPI } from '@lukehagar/plexjs';
import { PlexServer } from '../interfaces/plex-server';
import { v4 as uuidv4 } from 'uuid';
import { XMLParser } from 'fast-xml-parser';
import { Plex } from '@lukehagar/plexjs/sdk/plex';
import { SearchResult, SeasonType } from '../interfaces/search-result';

@Injectable({
  providedIn: 'root',
})
export class UtilsService {
  private plexToken: string | null = null;
  private plexAPI: PlexAPI;
  private clientID: string;

  constructor(private router: Router) {
    const storedToken = localStorage.getItem('plexToken');
    this.plexToken = storedToken;
    this.plexAPI = new PlexAPI({
      accessToken: storedToken || '',
    });
    const savedUUID = localStorage.getItem('clientID');
    this.clientID = savedUUID || uuidv4();
    if (!savedUUID) localStorage.setItem('clientID', this.clientID);
  }

  async plexLogin(username: string, password: string): Promise<boolean> {
    try {
      const result = await this.plexAPI.authentication.postUsersSignInData({
        clientID: '3381b62b-9ab7-4e37-827b-203e9809eb58',
        clientName: 'plexer',
        deviceNickname: 'Roku 3',
        clientVersion: '2.4.1',
        platform: 'Web',
        requestBody: {
          login: username,
          password: password,
        },
      });

      if (result.userPlexAccount?.authToken) {
        localStorage.setItem('plexToken', result.userPlexAccount.authToken);
        localStorage.setItem('plexUsername', result.userPlexAccount.username);
        localStorage.setItem('imageUrl', result.userPlexAccount.thumb);

        this.plexToken = result.userPlexAccount.authToken;
        this.plexAPI = new PlexAPI({ accessToken: this.plexToken });

        return true;
      }
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }

    return false;
  }

  async isLoggedIn(): Promise<boolean> {
    const token = localStorage.getItem('plexToken');
    if (!token) return false;

    try {
      const api = new PlexAPI({ accessToken: token });
      const details = await api.authentication.getTokenDetails();
      return !!details.userPlexAccount?.id;
    } catch (error) {
      console.warn('Token validation failed:', error);
      this.logout();
      return false;
    }
  }

  getPlexServers(): Promise<PlexServer[]> {
    return this.plexAPI.plex
      .getServerResources(this.clientID)
      .then((response: any) => {
        const devices = response?.plexDevices ?? [];

        if (!Array.isArray(devices) || devices.length === 0) {
          return [];
        }

        const servers: PlexServer[] = [];

        devices.forEach((device: any) => {
          const connections = device.connections ?? [];

          connections.forEach((conn: any) => {
            servers.push({
              name: device.name ?? 'Unknown',
              address: conn.address,
              port: conn.port,
              online: false,
              protocol: conn.protocol as 'http' | 'https',
              local: conn.local === true,
              isChecked: false,
            });
          });
        });

        return servers;
      })
      .catch((err) => {
        console.error('Error retrieving Plex servers:', err);
        return [];
      });
  }

  async isServerOnline(server: PlexServer): Promise<boolean> {
    const baseURL = `${server.protocol}://${server.address}:${server.port}`;
    const tempAPI = new PlexAPI({
      accessToken: this.plexToken || '',
      serverURL: baseURL,
    });

    try {
      const result = await tempAPI.server.getServerCapabilities();
      this.plexAPI = tempAPI;
      return !!result.object?.mediaContainer;
    } catch (err) {
      console.warn(`Failed to get capabilities for ${baseURL}:`, err);
      return false;
    }
  }

  logout(): void {
    localStorage.removeItem('plexToken');
    localStorage.removeItem('plexUsername');
    localStorage.removeItem('imageUrl');
    localStorage.removeItem('selectedServer');
    this.plexToken = null;
    this.plexAPI = new PlexAPI();
    this.router.navigate(['/auth']);
  }

  getUsername(): string | null {
    return localStorage.getItem('plexUsername');
  }

  getUserImage(): string | null {
    return localStorage.getItem('imageUrl');
  }

  getPlexUrl(): string | null {
    const selectedServer = localStorage.getItem('selectedServer');
    if (selectedServer) {
      const server: PlexServer = JSON.parse(selectedServer);
      return `${server.protocol}://${server.address}:${server.port}`;
    }
    return null;
  }

  async searchPlex(query: string): Promise<any[]> {
    const selectedServer = localStorage.getItem('selectedServer');
    if (!selectedServer || !this.plexToken) {
      return [];
    }

    // const result = await scopedAPI.search.getSearchResults(query);
    // console.log('Raw search result:', result);

    //cannot use plex sdk here, types are wrong
    const server: PlexServer = JSON.parse(selectedServer);
    const baseURL = `${server.protocol}://${server.address}:${server.port}`;

    const url = `${baseURL}/library/search?query=${encodeURIComponent(
      query
    )}&X-Plex-Token=${this.plexToken}`;
    try {
      const response = await fetch(url);
      const xml = await response.text();
      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '',
        isArray: () => false,
        processEntities: true,
      });
      const result = parser.parse(xml);
      console.log('Parsed search result:', result);
      if (!result?.MediaContainer) {
        console.warn('No MediaContainer found in search result');
        return [];
      }
      if (result.MediaContainer.size == 0) {
        console.warn('No search results found for query:', query);
        return [];
      }

      const searchResults = result?.MediaContainer?.SearchResult;

      if (!searchResults) return [];

      const tempArray = Array.isArray(searchResults)
        ? searchResults
        : [searchResults];
      if (tempArray.length === 0) {
        console.warn('No search results found for query:', query);
        return [];
      }
      // define the type
      for (const item of tempArray) {
        if (item.Directory) {
          item.type = item.Directory.type || 'directory';
          item.data = item.Directory;
        } else if (item.Video) {
          item.type = item.Video.type || 'video';
          item.data = item.Video;
        }

        if (item.Video && item.Video.Genre) {
          const genres = Array.isArray(item.Video.Genre)
            ? item.Video.Genre
            : [item.Video.Genre];
          item.genres = genres.map((g: any) => g.tag);
        } else if (item.Directory && item.Directory.Genre) {
          const genres = Array.isArray(item.Directory.Genre)
            ? item.Directory.Genre
            : [item.Directory.Genre];

          item.genres = genres.map((g: any) => g.tag);
        } else {
          item.genres = [];
        }

        if (
          item.Video &&
          item.Video.Media &&
          item.Video.Media.Part &&
          item.Video.Media.Part.key
        ) {
          item.downloadUrl = `${baseURL}${item.Video.Media.Part.key}?download=1&X-Plex-Token=${this.plexToken}`;
        }

        if (Array.isArray(item.data.Image)) {
          for (const image of item.data.Image) {
            if (image?.url) {
              image.url = `${baseURL}${image.url}?X-Plex-Token=${this.plexToken}`;
              if (image.type == 'coverPoster') {
                item.cover = image.url;
              } else if (image.type == 'background') {
                item.background = image.url;
              }
            }
          }
        }
      }
      console.log('Parsed search results:', tempArray);
      return tempArray;
    } catch (err) {
      console.error('Manual search failed:', err);
      return [];
    }
  }

  async getShowDownloadDetails(show: SearchResult): Promise<SeasonType[]> {
    if (!show || !show.data) {
      console.warn('No data or key found in show:', show);
      return [];
    }
    const selectedServer = localStorage.getItem('selectedServer');
    if (!selectedServer || !this.plexToken) {
      console.warn('No selected server or Plex token found');
      return [];
    }
    const server: PlexServer = JSON.parse(selectedServer);
    const baseURL = `${server.protocol}://${server.address}:${server.port}`;
    const url = `${baseURL}${show.data.key}?X-Plex-Token=${this.plexToken}`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.error('Failed to fetch show details:', response.statusText);
        return [];
      }
      const xml = await response.text();

      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '',
        isArray: () => false,
        processEntities: true,
      });
      const result = parser.parse(xml);
      if (!result?.MediaContainer) {
        console.warn('No MediaContainer found in show details');
        return [];
      }
      const showDetails =
        result.MediaContainer.Video || result.MediaContainer.Directory;
      if (!showDetails) {
        console.warn('No video or directory found in show details');
        return [];
      }
      const seasons = [];
      for (const season of showDetails) {
        if (season.type !== 'season') continue;
        const tempSeason = {
          title: season.title,
          key: season.key,
          type: season.type,
          episodes: [],
        } as SeasonType;
        const url = `${baseURL}${season.key}?X-Plex-Token=${this.plexToken}`;
        const seasonResponse = await fetch(url);
        if (!seasonResponse.ok) {
          console.error(
            'Failed to fetch season details:',
            seasonResponse.statusText
          );
          continue;
        }
        const seasonXml = await seasonResponse.text();
        const parser = new XMLParser({
          ignoreAttributes: false,
          attributeNamePrefix: '',
          isArray: () => false,
          processEntities: true,
        });
        const seasonResult = parser.parse(seasonXml);
        console.log(seasonResult);
        for (const episode of seasonResult.MediaContainer.Video || []) {
          tempSeason.episodes.push({
            title: episode.title,
            key: episode.key,
            downloadUrl: `${baseURL}${episode.Media.Part.key}?download=1&X-Plex-Token=${this.plexToken}`,
          });
        }
        if (tempSeason.episodes.length > 0) {
          seasons.push(tempSeason);
        }
      }
      return seasons;
    } catch (err) {
      console.error('Error fetching show details:', err);
      return [];
    }
  }
}
