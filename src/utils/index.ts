import fs from 'fs-extra'
import path from 'path';


export function getDirectories(srcPath: string)
{
    const items = fs.readdirSync(srcPath);
    const directories: string[] = [];
  
    for (const item of items) {
        const itemPath = path.join(srcPath, item);
        const stats = fs.statSync(itemPath);
        
        if (stats.isDirectory()) {
            directories.push(item);
        }
    }
  
    return directories;
}