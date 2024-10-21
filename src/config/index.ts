import { ensureDirSync, existsSync, readFileSync, writeFileSync } from "fs-extra";
import { IDictionary } from "../shared/interfaces";
import path from "path";
import template from "./template";


export default class Configuration
{
    private _config!: IDictionary

    public load(dir: string): Configuration
    {
        ensureDirSync(dir);

        const configFilePath = path.join(dir, 'config.json');

        if (!existsSync(configFilePath))
        {
            writeFileSync(configFilePath, JSON.stringify(template));
            this._config = template;
        }
        else
        {
            const data = readFileSync(configFilePath, 'utf-8');
            this._config = JSON.parse(data);
        }

        return this;
    }

    public set(key: string, value: any)
    {
        if (key && value != null)
        {
            this._config[key] = value;
        }
    }

    public get(key: string): any
    {
        if (key)
        {
            return this._config[key];
        }
        else
        {
            throw new Error();
        }
    }
}