import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const GITHUB_API_URL = 'https://api.github.com';
const getHeaders = () => {
  const headers = {
    Accept: 'application/vnd.github.v3+json',
  };
  if (process.env.GITHUB_API_TOKEN && process.env.GITHUB_API_TOKEN.trim() !== '' && !process.env.GITHUB_API_TOKEN.startsWith('your_github_token')) {
    headers.Authorization = `Bearer ${process.env.GITHUB_API_TOKEN}`;
  }
  return headers;
};

export async function getUserProfile(username) {
  try {
    const response = await axios.get(`${GITHUB_API_URL}/users/${username}`, { headers: getHeaders() });
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error('GitHub user not found');
    }
    if (error.response?.status === 403) {
      throw new Error('GitHub API rate limit exceeded');
    }
    throw error;
  }
}

export async function getUserRepositories(username) {
  try {
    const response = await axios.get(`${GITHUB_API_URL}/users/${username}/repos`, {
      headers: getHeaders(),
      params: {
        per_page: 100,
        sort: 'updated',
        direction: 'desc',
      },
    });
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error('GitHub user not found');
    }
    if (error.response?.status === 403) {
      throw new Error('GitHub API rate limit exceeded');
    }
    throw error;
  }
}

// Fetch the README and key source files from a repository
export async function getRepoContent(username, repoName) {
  try {
    const content = { readme: null, files: [] };

    // Try to fetch README (various common names)
    const readmeNames = ['README.md', 'readme.md', 'README', 'Readme.md'];
    for (const name of readmeNames) {
      try {
        const r = await axios.get(
          `${GITHUB_API_URL}/repos/${username}/${repoName}/contents/${name}`,
          { headers: getHeaders() }
        );
        if (r.data.content) {
          content.readme = Buffer.from(r.data.content, 'base64').toString('utf-8').slice(0, 4000);
          break;
        }
      } catch { /* try next name */ }
    }

    // Fetch top-level directory listing
    let files = [];
    try {
      const r = await axios.get(
        `${GITHUB_API_URL}/repos/${username}/${repoName}/contents/`,
        { headers: getHeaders() }
      );
      files = r.data;
    } catch { /* no contents */ }

    // Fetch a few key source files (limit to avoid rate limits)
    const sourceExtensions = ['.js', '.ts', '.py', '.java', '.go', '.rb', '.php', '.c', '.cpp', '.cs', '.swift', '.rs', '.html', '.css', '.json'];
    const interestingNames = ['package.json', 'requirements.txt', 'Dockerfile', 'docker-compose.yml', 'Makefile', 'setup.py', 'pyproject.toml', 'go.mod', 'Cargo.toml', 'pom.xml', 'build.gradle'];

    const candidates = files
      .filter((f) => f.type === 'file')
      .filter((f) => {
        const lower = f.name.toLowerCase();
        return interestingNames.includes(lower) || sourceExtensions.some((ext) => lower.endsWith(ext));
      })
      .slice(0, 5);

    for (const file of candidates) {
      try {
        const r = await axios.get(file.download_url, { headers: getHeaders() });
        const text = typeof r.data === 'string' ? r.data : JSON.stringify(r.data);
        content.files.push({
          name: file.name,
          content: text.slice(0, 2000),
        });
      } catch { /* skip file */ }
    }

    return content;
  } catch (error) {
    return { readme: null, files: [] };
  }
}

export function extractUsernameFromUrl(input) {
  // Check if it's a URL
  if (input.includes('github.com/')) {
    const match = input.match(/github\.com\/([^/?]+)/);
    if (match) {
      return match[1];
    }
  }
  // Otherwise treat it as a username
  return input.trim();
}

export function analyzeRepositories(repos) {
  if (!repos || repos.length === 0) {
    return {
      totalStars: 0,
      totalForks: 0,
      repoCount: 0,
      mostStarredRepo: null,
      averageStars: 0,
      topLanguage: null,
    };
  }

  const totalStars = repos.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0);
  const totalForks = repos.reduce((sum, repo) => sum + (repo.forks_count || 0), 0);
  const repoCount = repos.length;

  const mostStarredRepo = repos.reduce((max, repo) =>
    (repo.stargazers_count || 0) > (max.stargazers_count || 0) ? repo : max
  );

  const averageStars = repoCount > 0 ? (totalStars / repoCount).toFixed(2) : 0;

  // Find top language
  const languageCount = {};
  repos.forEach((repo) => {
    if (repo.language) {
      languageCount[repo.language] = (languageCount[repo.language] || 0) + 1;
    }
  });

  const topLanguage = Object.keys(languageCount).length > 0
    ? Object.entries(languageCount).sort((a, b) => b[1] - a[1])[0][0]
    : null;

  return {
    totalStars,
    totalForks,
    repoCount,
    mostStarredRepo: mostStarredRepo.name || null,
    averageStars: parseFloat(averageStars),
    topLanguage,
  };
}

export function calculateTechStack(repos) {
  if (!repos || repos.length === 0) {
    return {
      languages: [],
      techBreakdown: {},
    };
  }

  const languageCount = {};
  repos.forEach((repo) => {
    if (repo.language) {
      languageCount[repo.language] = (languageCount[repo.language] || 0) + 1;
    }
  });

  const sortedLanguages = Object.entries(languageCount)
    .sort((a, b) => b[1] - a[1])
    .map(([lang, count]) => ({
      language: lang,
      count,
      percentage: ((count / repos.length) * 100).toFixed(1),
    }));

  return {
    languages: sortedLanguages,
    techBreakdown: languageCount,
  };
}

export function calculateActivityMetrics(repos, profile) {
  if (!repos || repos.length === 0) {
    return {
      lastActivityDate: null,
      activityLevel: 'inactive',
      daysSinceLastUpdate: null,
      commitsFrequency: 'N/A',
    };
  }

  // Find the most recently updated repo
  const lastUpdated = repos.reduce((latest, repo) => {
    const repoDate = new Date(repo.updated_at);
    const latestDate = new Date(latest.updated_at);
    return repoDate > latestDate ? repo : latest;
  });

  const lastActivityDate = lastUpdated.updated_at;
  const daysSinceLastUpdate = Math.floor(
    (new Date() - new Date(lastActivityDate)) / (1000 * 60 * 60 * 24)
  );

  let activityLevel;
  if (daysSinceLastUpdate <= 7) {
    activityLevel = 'very active';
  } else if (daysSinceLastUpdate <= 30) {
    activityLevel = 'active';
  } else if (daysSinceLastUpdate <= 90) {
    activityLevel = 'moderately active';
  } else if (daysSinceLastUpdate <= 180) {
    activityLevel = 'somewhat inactive';
  } else {
    activityLevel = 'inactive';
  }

  // Calculate developer level based on account age, followers, and repo count
  const accountAge = Math.floor(
    (new Date() - new Date(profile.created_at)) / (1000 * 60 * 60 * 24 * 365)
  );

  let developerLevel = 'Junior';
  if (accountAge >= 5 && profile.followers >= 50 && repos.length >= 10) {
    developerLevel = 'Senior';
  } else if (accountAge >= 3 && profile.followers >= 20 && repos.length >= 5) {
    developerLevel = 'Mid-Level';
  }

  return {
    lastActivityDate,
    activityLevel,
    daysSinceLastUpdate,
    developerLevel,
  };
}
