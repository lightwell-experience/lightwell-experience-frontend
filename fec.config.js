/* eslint-disable @typescript-eslint/no-require-imports */
const path = require('path');
const { dependencies, insights } = require('./package.json');

const sassPrefix = insights.appname.replace(/-(\w)/g, (_, match) => match.toUpperCase());
const srcDir = path.resolve(__dirname, './src');
/** Must match chrome `useLightwellRouteSetup` / theme-bootstrap class on <html>. */
const KIT_CSS_SCOPE = 'html.lightwell-v1-theme';
const KIT_CSS_PATH_SEGMENT = `${path.sep}src${path.sep}kit${path.sep}`;

/**
 * Scope kit co-located CSS to Lightwell's html theme class instead of the app sass prefix.
 * Chrome adds `lightwell-v1-theme` on <html> for /lightwell* routes.
 */
class KitCssScopePlugin {
  apply(compiler) {
    const patchedOptions = new WeakSet();
    const patchRules = (rules) => {
      let patched = 0;
      for (const rule of rules || []) {
        if (rule.oneOf) patched += patchRules(rule.oneOf);
        if (rule.rules) patched += patchRules(rule.rules);
        const useEntries = Array.isArray(rule.use) ? rule.use : rule.use ? [rule.use] : [];
        for (const entry of useEntries) {
          if (!entry || typeof entry !== 'object') continue;
          const loader = typeof entry.loader === 'string' ? entry.loader : '';
          if (!loader.includes('sass-loader') || typeof entry.options?.additionalData !== 'function') {
            continue;
          }
          if (patchedOptions.has(entry.options)) continue;
          const originalAdditionalData = entry.options.additionalData;
          entry.options.additionalData = (content, loaderContext) => {
            const resourcePath = loaderContext.resourcePath || '';
            if (resourcePath.includes(KIT_CSS_PATH_SEGMENT)) {
              if (!content.includes('{')) {
                return content;
              }
              return `${KIT_CSS_SCOPE} {\n${content}\n}`;
            }
            return originalAdditionalData(content, loaderContext);
          };
          patchedOptions.add(entry.options);
          patched += 1;
        }
      }
      return patched;
    };

    const run = () => {
      const count = patchRules(compiler.options.module?.rules || []);
      if (count > 0) {
        console.log(`[KitCssScopePlugin] scoped ${count} sass-loader(s) → ${KIT_CSS_SCOPE} for src/kit/**`);
      }
    };

    run();
    compiler.hooks.afterEnvironment.tap('KitCssScopePlugin', run);
  }
}

module.exports = {
  sassPrefix: `.${sassPrefix}`,
  appUrl: '/lightwell',
  debug: true,
  devtool: 'hidden-source-map',
  useProxy: true,
  interceptChromeConfig: false,
  plugins: [new KitCssScopePlugin()],
  moduleFederation: {
    exposes: {
      './RootApp': path.resolve(__dirname, './src/AppEntry.tsx'),
      './BeaconPdfEntry': path.resolve(__dirname, './src/moduleEntries/BeaconPdfEntry.tsx'),
      './CoveragePdfEntry': path.resolve(__dirname, './src/moduleEntries/CoveragePdfEntry.tsx'),
    },
    exclude: ['react-router-dom'],
    shared: [
      {
        'react-router-dom': {
          singleton: true,
          import: false,
          version: dependencies['react-router-dom'],
          requiredVersion: '>=6.0.0 <7.0.0',
        },
      },
      {
        '@unleash/proxy-client-react': {
          version: dependencies['@unleash/proxy-client-react'],
          singleton: true,
        },
      },
    ],
  },
  resolve: {
    modules: [srcDir, path.resolve(__dirname, './node_modules')],
  },
  routes: {
    ...(process.env.BACKEND_PORT && {
      '/api/content-sources/': {
        host: `http://127.0.0.1:${process.env.BACKEND_PORT}`,
      },
    }),
    ...(process.env.PDF_GENERATOR_PORT && {
      '/api/crc-pdf-generator': {
        host: `http://127.0.0.1:${process.env.PDF_GENERATOR_PORT}`,
      },
    }),
  },
};
