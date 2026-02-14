// API testing utility

import axios, { AxiosError } from 'axios';
import { Provider, TestResult } from '../types';

function getApiEndpoints(baseUrl: string, apiFormat: string): string[] {
  // Remove trailing slash
  let url = baseUrl.replace(/\/$/, '');

  const endpoints: string[] = [];

  // Check if URL already contains the endpoint path
  if (url.includes('/messages') || url.includes('/chat/completions') || url.includes('/v1/')) {
    return [url];
  }

  // Append appropriate endpoints - try different variations
  if (apiFormat === 'anthropic-messages') {
    endpoints.push(`${url}/messages`);
    endpoints.push(`${url}/v1/messages`);
    endpoints.push(url); // Some APIs don't need /messages suffix
  } else {
    endpoints.push(`${url}/chat/completions`);
    endpoints.push(`${url}/v1/chat/completions`);
    endpoints.push(url);
  }

  return endpoints;
}

export async function testProvider(provider: Provider): Promise<TestResult> {
  const result: TestResult = {
    provider: provider.name,
    success: false
  };

  const startTime = Date.now();

  // Get possible endpoints
  const endpoints = getApiEndpoints(provider.baseUrl, provider.apiFormat);

  // Try each endpoint
  for (const endpoint of endpoints) {
    try {
      let response;

      if (provider.apiFormat === 'anthropic-messages') {
        response = await axios.post(
          endpoint,
          {
            model: provider.models.default || provider.models.haiku || 'claude-3-haiku-20240307',
            max_tokens: 10,
            messages: [{ role: 'user', content: 'Hi' }]
          },
          {
            headers: {
              'x-api-key': provider.apiKey,
              'anthropic-version': '2023-06-01',
              'Content-Type': 'application/json'
            },
            timeout: 10000
          }
        );
      } else {
        response = await axios.post(
          endpoint,
          {
            model: provider.models.default || provider.models.haiku || 'gpt-4o-mini',
            max_tokens: 10,
            messages: [{ role: 'user', content: 'Hi' }]
          },
          {
            headers: {
              'Authorization': `Bearer ${provider.apiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 10000
          }
        );
      }

      // Success!
      result.success = true;
      result.latency = Date.now() - startTime;
      result.model = provider.models.default || provider.models.haiku;
      result.endpoint = endpoint;
      return result;

    } catch (error) {
      // Continue to next endpoint if 404
      if (error instanceof AxiosError && error.response?.status === 404) {
        continue;
      }

      // If other error, save it but continue trying
      if (error instanceof AxiosError) {
        const status = error.response?.status;

        // If 401/403, no need to try other endpoints
        if (status === 401 || status === 403) {
          result.success = false;
          result.latency = Date.now() - startTime;
          result.error = status === 401 ? 'Unauthorized (401) - Invalid API key' : 'Forbidden (403) - API key lacks permission';
          return result;
        }
      }
    }
  }

  // All endpoints failed
  result.success = false;
  result.latency = Date.now() - startTime;
  result.error = `All endpoints failed. Tried: ${endpoints.join(', ')}`;

  return result;
}
