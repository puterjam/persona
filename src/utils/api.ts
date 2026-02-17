// API testing utility

import axios, { AxiosError } from 'axios';
import * as https from 'https';
import * as http from 'http';
import * as dns from 'dns';
import { URL } from 'url';
import { Provider, TestResult } from '../types';

function getApiEndpoints(baseUrl: string, apiFormat: string): string[] {
  let url = baseUrl.replace(/\/$/, '');

  const endpoints: string[] = [];

  if (url.includes('/messages') || url.includes('/chat/completions') || url.includes('/v1/')) {
    return [url];
  }

  if (apiFormat === 'anthropic-messages') {
    endpoints.push(`${url}/messages`);
    endpoints.push(`${url}/v1/messages`);
    endpoints.push(url);
  } else {
    endpoints.push(`${url}/chat/completions`);
    endpoints.push(`${url}/v1/chat/completions`);
    endpoints.push(url);
  }

  return endpoints;
}

interface TimingResult {
  dns: number;
  connect: number;
  tls: number;
  ttfb: number;
}

async function measureConnectionTiming(urlStr: string): Promise<TimingResult> {
  const timings: TimingResult = {
    dns: 0,
    connect: 0,
    tls: 0,
    ttfb: 0
  };

  const startTime = Date.now();

  return new Promise((resolve) => {
    const urlObj = new URL(urlStr);
    const isHttps = urlObj.protocol === 'https:';
    const hostname = urlObj.hostname;
    
    // Step 1: DNS lookup
    dns.lookup(hostname, (err) => {
      if (err) {
        timings.dns = Date.now() - startTime;
        timings.connect = timings.tls = timings.ttfb = timings.dns;
        resolve(timings);
        return;
      }
      
      timings.dns = Date.now() - startTime;
      
      // Step 2: TCP + TLS connection
      const connectStart = Date.now();
      
      if (isHttps) {
        const options: https.RequestOptions = {
          hostname: hostname,
          port: urlObj.port || 443,
          path: '/',
          method: 'HEAD',
          timeout: 10000
        };
        
        const req = https.request(options, (res) => {
          timings.ttfb = Date.now() - startTime;
          timings.connect = connectStart - startTime;
          timings.tls = timings.ttfb - timings.connect; // approximate
          res.destroy();
          resolve(timings);
        });
        
        req.on('error', () => {
          timings.connect = timings.tls = timings.ttfb = Date.now() - startTime;
          resolve(timings);
        });
        
        req.on('timeout', () => {
          req.destroy();
          timings.connect = timings.tls = timings.ttfb = Date.now() - startTime;
          resolve(timings);
        });
        
        req.end();
      } else {
        const options: http.RequestOptions = {
          hostname: hostname,
          port: urlObj.port || 80,
          path: '/',
          method: 'HEAD',
          timeout: 10000
        };
        
        const req = http.request(options, (res) => {
          timings.ttfb = timings.connect = Date.now() - startTime;
          res.destroy();
          resolve(timings);
        });
        
        req.on('error', () => {
          timings.connect = timings.ttfb = Date.now() - startTime;
          resolve(timings);
        });
        
        req.on('timeout', () => {
          req.destroy();
          timings.connect = timings.ttfb = Date.now() - startTime;
          resolve(timings);
        });
        
        req.end();
      }
    });
  });
}

export async function testProvider(provider: Provider): Promise<TestResult> {
  const result: TestResult = {
    provider: provider.name,
    success: false
  };

  const overallStart = Date.now();

  // Get possible endpoints
  const endpoints = getApiEndpoints(provider.baseUrl, provider.apiFormat);

  // First, measure connection timing with HEAD request to the host
  const hostUrl = new URL(provider.baseUrl.replace(/\/$/, ''));
  const connUrl = `${hostUrl.protocol}//${hostUrl.host}/`;
  const connTiming = await measureConnectionTiming(connUrl);

  // Then measure full API request timing
  for (const endpoint of endpoints) {
    const requestStart = Date.now();
    
    try {
      let response;

      const config: any = {
        headers: provider.apiFormat === 'anthropic-messages' ? {
          'x-api-key': provider.apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        } : {
          'Authorization': `Bearer ${provider.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      };

      if (provider.apiFormat === 'anthropic-messages') {
        response = await axios.post(
          endpoint,
          {
            model: provider.models.default || provider.models.haiku || 'claude-3-haiku-20240307',
            max_tokens: 10,
            messages: [{ role: 'user', content: 'Hi' }]
          },
          config
        );
      } else {
        response = await axios.post(
          endpoint,
          {
            model: provider.models.default || provider.models.haiku || 'gpt-4o-mini',
            max_tokens: 10,
            messages: [{ role: 'user', content: 'Hi' }]
          },
          config
        );
      }

      const requestDone = Date.now();
      const totalLatency = requestDone - overallStart;

      result.success = true;
      result.latency = totalLatency;
      result.model = provider.models.default || provider.models.haiku;
      result.endpoint = endpoint;
      
      // Calculate timing breakdown
      const breakdown: Record<string, number> = {};
      
      // DNS lookup
      if (connTiming.dns > 0) {
        breakdown.dns = connTiming.dns;
      }
      
      // Connection (TCP + TLS)
      if (connTiming.tls > 0) {
        breakdown.connect = connTiming.tls - connTiming.dns;
      } else if (connTiming.connect > 0) {
        breakdown.connect = connTiming.connect - connTiming.dns;
      }
      
      // TLS handshake (if HTTPS)
      // Note: TLS time is included in connect for HTTPS
      
      // Time to first byte
      if (connTiming.ttfb > 0) {
        breakdown.ttfb = connTiming.ttfb - connTiming.connect;
      }
      
      // API request time (includes sending request, server processing, receiving response)
      breakdown.api = requestDone - requestStart;
      
      result.timingBreakdown = breakdown;
      return result;

    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 404) {
        continue;
      }

      if (error instanceof AxiosError) {
        const status = error.response?.status;

        if (status === 401 || status === 403) {
          result.success = false;
          result.latency = Date.now() - overallStart;
          result.error = status === 401 ? 'Unauthorized (401) - Invalid API key' : 'Forbidden (403) - API key lacks permission';
          return result;
        }
      }
    }
  }

  result.success = false;
  result.latency = Date.now() - overallStart;
  result.error = `All endpoints failed. Tried: ${endpoints.join(', ')}`;

  return result;
}
