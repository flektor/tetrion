import { Injectable, OnInit } from "@angular/core";
import { LoaderService } from '../../loader/loader.service';
import { UserService } from '../user/user.service';
import { ThemeConfig } from './theme.interface';

@Injectable()
export class ThemeService implements OnInit {

  private themeNames: Array<string>;


  async loadPresetThemeConfigs(): Promise<void> {

    if (this.isLoaded) return;

    this.presetConfigs = await this.loader.loadJson("assets/themes-config.json");
    this.themeNames = this.getThemeNames();
    this.isLoaded = true;
  }


  loadThemeByName(name: string): ThemeConfig {
    const configs = [].concat(this.presetConfigs);

    // for some reason concut didn't work here
    // configs.concat(this.user.config.theme.configs )
    for (let config of this.user.config.theme.configs) {
      configs.push(config)
    }

    for (let config of configs) {

      if (!config) continue;

      if (name === config.name) {
        return config;
      }
    }

    console.error(new ThemeNotFoundError());
    return configs[0];

  }


  async saveCustomTheme(theme: ThemeConfig): Promise<void> {
    let name: string;
    for (let config of this.user.config.theme.configs) {
      if (theme.name === config.name) {
        config = theme;
        name = theme.name;
        break;
      }
    }

    if (name === undefined) {
      this.user.config.theme.configs.push(theme);
      name = theme.name;
      this.themeNames.push(name);
    }

    this.user.config.theme.active = name;
    this.user.updateTheme();

  }



  doesThemeExist(name: string): boolean {
    const configs = [].concat(this.presetConfigs);
    configs.concat(this.user.config.theme.configs);

    for (let config of configs) {
      if (name === config.name) {
        return true;
      }
    }

    return false;
  }


  private getThemeNames(): Array<string> {
    const names = new Array();
    if (this.presetConfigs && this.user.config.theme) {
      const configs = [].concat(this.presetConfigs);


      // for some reason concut didn't work here
      // configs.concat(this.user.config.theme.configs )
      for (let config of this.user.config.theme.configs) {
        configs.push(config)
      }

      for (let config of configs) {
        if (config) {
          names.push(config.name)
        }
      }
      return names;
    }
  }


  async ngOnInit() {
    await this.user.onSync();
  }


  constructor(private loader: LoaderService, private user: UserService) { }


  private presetConfigs: Array<ThemeConfig>;
  private isLoaded: boolean = false;

}

export class ThemeNotFoundError extends Error {
  message = 'theme-not-found';
}