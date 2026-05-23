#!/usr/bin/env tsx

import * as esbuild from 'esbuild';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';

// Ensure dist directory exists
if (!existsSync('./dist')) {
  mkdirSync('./dist', { recursive: true });
}

// Add lazy-loaded services here as your extension grows.
// Each entry is built as a separate chunk under dist/lazy/.
const lazyServices: string[] = [
  // 'src/services/myHeavyService.ts',
];

const lazyServiceExternals = lazyServices.map((s) => s.replace('src/', '').replace('.ts', ''));

const createConfig = (isProduction = false): esbuild.BuildOptions => ({
  entryPoints: ['./src/extension.ts'],
  bundle: true,
  outfile: './dist/extension.js',
  external: ['vscode', ...lazyServiceExternals],
  format: 'cjs',
  platform: 'node',
  target: 'node22',
  sourcemap: isProduction ? false : 'inline',
  minify: isProduction,
  treeShaking: true,
  mainFields: ['module', 'main'],
  conditions: ['node'],
  define: {
    'process.env.NODE_ENV': JSON.stringify(isProduction ? 'production' : 'development'),
  },
  keepNames: false,
  legalComments: 'none',
  drop: isProduction ? ['console', 'debugger'] : [],
  metafile: true,
  plugins: [],
  ...(isProduction && {
    minifyWhitespace: true,
    minifyIdentifiers: true,
    minifySyntax: true,
    ignoreAnnotations: true,
  }),
});

async function buildLazyServices(isProduction: boolean): Promise<void> {
  if (lazyServices.length === 0) return;

  console.log('📦 Building lazy-loaded services...');

  for (const service of lazyServices) {
    const serviceName = service.split('/').pop()?.replace('.ts', '') || 'service';
    const outfile = `./dist/lazy/${serviceName}.js`;

    if (!existsSync('./dist/lazy')) {
      mkdirSync('./dist/lazy', { recursive: true });
    }

    const config: esbuild.BuildOptions = {
      entryPoints: [service],
      bundle: true,
      outfile,
      external: ['vscode'],
      format: 'cjs',
      platform: 'node',
      target: 'node22',
      sourcemap: false,
      minify: isProduction,
      treeShaking: true,
      mainFields: ['module', 'main'],
      conditions: ['node'],
      keepNames: false,
      legalComments: 'none',
      ...(isProduction && {
        minifyWhitespace: true,
        minifyIdentifiers: true,
        minifySyntax: true,
      }),
    };

    try {
      await esbuild.build(config);
      console.log(`  ✓ Built ${serviceName}.js`);
    } catch (error) {
      console.error(`  ✗ Failed to build ${serviceName}:`, error);
      throw error;
    }
  }
}

async function build(production = false): Promise<void> {
  try {
    console.log(`🚀 Building in ${production ? 'production' : 'development'} mode...`);

    await buildLazyServices(production);

    const config = createConfig(production);
    const result = await esbuild.build(config);

    if (result.metafile) {
      writeFileSync('./dist/meta.json', JSON.stringify(result.metafile, null, 2));

      const stats = readFileSync('./dist/extension.js');
      const sizeKB = (stats.length / 1024).toFixed(2);
      // Size targets apply to production (minified) builds only.
      // Dev builds include inline sourcemaps and are naturally much larger.
      const coreTargetKB = 100;
      const lazyTargetKB = 50;

      console.log('✅ Build completed successfully!');
      console.log(`📦 Main bundle: ${sizeKB} KB`);

      // Calculate lazy services total
      let lazyTotal = 0;
      for (const service of lazyServices) {
        const serviceName = service.split('/').pop()?.replace('.ts', '') || 'service';
        const lazyFile = `./dist/lazy/${serviceName}.js`;
        if (existsSync(lazyFile)) {
          const lazyStats = readFileSync(lazyFile);
          const lazySize = lazyStats.length / 1024;
          lazyTotal += lazySize;
          console.log(`  └─ ${serviceName}.js: ${lazySize.toFixed(2)} KB`);
        }
      }
      if (lazyServices.length > 0) {
        console.log(`📦 Lazy services total: ${lazyTotal.toFixed(2)} KB`);
        console.log(`📦 Total size: ${(parseFloat(sizeKB) + lazyTotal).toFixed(2)} KB`);
      }

      // Only enforce size targets on production builds
      if (production) {
        const totalSize = parseFloat(sizeKB) + lazyTotal;
        const totalTarget = coreTargetKB + lazyTargetKB;

        if (parseFloat(sizeKB) > coreTargetKB) {
          console.log(
            `⚠️  Main bundle exceeds ${coreTargetKB}KB target by ${(parseFloat(sizeKB) - coreTargetKB).toFixed(2)}KB`,
          );
        } else {
          console.log(
            `✨ Main bundle is ${(coreTargetKB - parseFloat(sizeKB)).toFixed(2)}KB under ${coreTargetKB}KB target!`,
          );
        }

        if (lazyServices.length > 0 && totalSize > totalTarget) {
          console.log(
            `⚠️  Total bundle exceeds ${totalTarget}KB target by ${(totalSize - totalTarget).toFixed(2)}KB`,
          );
        }
      }

      const inputs = Object.keys(result.metafile.inputs).length;
      const outputs = Object.keys(result.metafile.outputs).length;
      console.log(`📋 Bundle analysis: ${inputs} input files, ${outputs} output files`);
    }
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

async function watch(): Promise<void> {
  console.log('👀 Starting watch mode...');

  const config = createConfig(false);
  const context = await esbuild.context({
    ...config,
    plugins: [
      ...(config.plugins ?? []),
      {
        name: 'watch-plugin',
        setup(build) {
          build.onEnd((result) => {
            if (result.errors.length === 0) {
              console.log('🔄 Rebuild completed at', new Date().toLocaleTimeString());
            }
          });
        },
      },
    ],
  });

  await context.watch();
}

export { build, createConfig, watch };

if (require.main === module) {
  const args = process.argv.slice(2);
  const isProduction = args.includes('--production') || process.env['NODE_ENV'] === 'production';
  const isWatch = args.includes('--watch');

  if (isWatch) {
    watch().catch(console.error);
  } else {
    build(isProduction).catch(console.error);
  }
}
