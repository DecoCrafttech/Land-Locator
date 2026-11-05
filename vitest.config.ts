import {defineConfig} from 'vitest/config';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
export default defineConfig({test:{include:['tests/**/*.test.ts'],fileParallelism:false,env:{LAND_LOCATOR_DATA_DIR:mkdtempSync(join(tmpdir(),'land-locator-test-'))}}});
