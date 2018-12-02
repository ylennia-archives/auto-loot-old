# auto-loot-old
tera-proxy module to loot items automatically

## Auto-update guide
- Create a folder called `auto-loot-old` in `tera-proxy/bin/node_modules` and download >> [`module.json`](https://raw.githubusercontent.com/seraphinush-gaming/auto-loot-old/master/module.json) << (right-click save link as...) into the folder

## Dependency
- `command` module
- `tera-game-state` module
- `tera-vec3` module

## Usage
- __`loot` · `ㅣㅐㅐㅅ`__
  - Toggle on/off
### Arguments
- __`auto`__
  - Toggle automatic loot attempt on interval on/off
- __`status`__
  - Send status of module and auto function

## Config
- __`auto`__
  - Initialize automatic loot attempt on interval on/off
  - Default is `true`
- __`enable`__
  - Initialize module on/off
  - Default is `true`
- __`loopInterval`__
  - Initialize loot attempt interval
  - Default is `300`
- __`lootDelay`__
  - Initialize loot attempt delay
  - Default is `400`


## Info
- Original author : [Saegusae](https://github.com/Saegusae)
- **Support seraph via paypal donations, thanks in advance : [paypal](https://www.paypal.me/seraphinush)**

## Changelog
<details>

    1.39
    - Removed `command` require()
    - Removed `tera-game-state` require()
    - Updated to `mod.command`
    - Updated to `mod.game`
    1.38
    - Removed font color bloat
    - Added `tera-game-state` dependency
    1.37
    - Updated script in accordance to Pinkipi's update on master branch
    - Refactored config file
    -- Added `auto`
    -- Added `enable`
    -- Added `loopInterval`
    -- Added `lootDelay`
    1.36
    - Added auto-update support
    - Updated to latest tera-data
    1.35
    - Added strongboxes to blacklist
    1.34
    - Updated code and font color
    1.33
    - Updated code aesthetics
    1.32
    - Updated code
    - Added string function
    1.31
    - Updated code aesthetics
    1.30
    - Updated code aesthetics
    1.22
    - Fixed error
    - Updated code
    1.21
    - Fixed error
    - Removed protocol version restriction
    1.20
    - Updated code and protocol version
    - Added `status` command
    1.10
    - Personalized code aesthetics
    1.00
    - Initial fork

</details>