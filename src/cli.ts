#!/usr/bin/env node

import { Command } from 'commander'
import Configuration from './config';
import { chromium } from 'playwright';
import { ensureDir, writeFile } from 'fs-extra';
import path from 'path';
import { homedir } from 'os';
import { getDirectories } from './utils';


const config = new Configuration().load(path.join(homedir(), './imdb-cli'));
const program = new Command();

program
.version('1.0.0')
.description('IMDb manager and Web scraper.');

program
.command('config [action] [key] [value]')
.description('Configure commands following')
.action(async (action: 'get'|'set', key: string, value: string) =>
{
    switch (key)
    {
        case 'location':
            {
                if (action === 'get')
                {
                    console.log(config.get(key));
                }
                else if (value && action === 'set')
                {
                    config.set(key, value);
                }
            }
            break;
    }
});

program
.command('add <id>')
.description('')
.action(async (id: string) =>
{
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    });
    const page = await context.newPage();

    await page.setExtraHTTPHeaders({
        'accept-language': 'en-US,en;q=0.9',
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8'
    });

    // 访问目标网页
    await page.goto(`https://www.imdb.com/title/${id}`);

    const name = await page.$eval('h1.sc-ec65ba05-0 > span.hero__primary-text', el => el.textContent);
    const description = await page.$eval('span.sc-fbb3c9a4-1.caMeWq', el => el.textContent);
    const stars = await page.$$eval('a.sc-cd7dc4b7-1.kVdWAO', els => els.map(el => el.textContent));
    const director = await page.$$eval('ul.ipc-metadata-list.ipc-metadata-list--dividers-all.sc-cd7dc4b7-8.immMHv.ipc-metadata-list--base > li.ipc-metadata-list__item', elements =>
    {
        const names: string[] = [];
        for (const element of elements)
        {
            const span = element.querySelector('span.ipc-metadata-list-item__label');
            const links = element.querySelectorAll('a.ipc-metadata-list-item__list-content-item--link');
            
            if (span && span.textContent === 'Director')
            {
                links.forEach(link => names.push(link.textContent as string));
            }
        }
        return names;
    });
    const writers = await page.$$eval('ul.ipc-metadata-list.ipc-metadata-list--dividers-all.sc-cd7dc4b7-8.immMHv.ipc-metadata-list--base > li.ipc-metadata-list__item', elements =>
    {
        const names: string[] = [];
        for (const element of elements)
        {
            const span = element.querySelector('span.ipc-metadata-list-item__label');
            const links = element.querySelectorAll('a.ipc-metadata-list-item__list-content-item--link');
            
            if (span && span.textContent?.includes('Writer'))
            {
                links.forEach(link => names.push(link.textContent as string));
            }
        }
        return names;
    });

    const targetDir = path.join(config.get('location'), id);

    await ensureDir(targetDir);

    const obj = {id,name,description,stars,director,writers,poster:{source:'internal',url:'./poster.png'},sources:{internal:{url:''},external:{url:''}}};

    await writeFile(path.join(targetDir, 'imdb.config.json'), JSON.stringify(obj));

    await page.waitForTimeout(1000);
    await browser.close();
});

program
.command('list')
.description("List all resources you've installed.")
.action(async () =>
{
    const moviesDir = config.get('location');
    const directories = getDirectories(moviesDir);

    console.log(directories);
});


program.parse(process.argv);