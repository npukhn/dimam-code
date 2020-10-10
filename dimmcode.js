let io = require('socket.io-client')

const max_top_position = 5;

const pause_before_disconnect = 1e3;
const pause_before_reconnect = 6e3;

const pause_before_next_ad = [30e3, 35e3];

const accounts = [

  {
    name: 'Dima',
    url: "vk_access_token_settings=&vk_app_id=7602024&vk_are_notifications_enabled=0&vk_is_app_user=0&vk_is_favorite=0&vk_language=ru&vk_platform=&vk_ref=other&vk_ts=1602191596&vk_user_id=222856843&sign=CQ0qvEaDuEZibyoa5UNfr2eQUzIQL5aPWEMZ-wwlOHg"
  },

]


class Account {

  static accsMoney = {}

  static countStolen = _ => {
    let totalSumm = 0;
    Object.keys(Account.accsMoney).forEach(name => {
      totalSumm += Account.accsMoney[name] - 40
    })
    return ((totalSumm / 2) * 0.003).toFixed(3)

  }


  constructor(name, url) {
    this.name = name;
    Account.accsMoney[name] = 0;
    this.url = url;
    this.topPlace = 0;
    this.forseStop = false;
    this.timeLeft = 0;
    this.reconector = 0;
    this.openAndManageSocket();
    this.startTimeLeftCounter();
  }

  startTimeLeftCounter() {
    setInterval(() => {
      if (this.timeLeft) this.timeLeft -= 1e3;
    }, 1e3);
  }



  async montrAd() {
    this.timeLeft = getRndInteger(pause_before_next_ad[0], pause_before_next_ad[1]);
    await DELAY(this.timeLeft)
    if (this.forseStop) return;

    console.log(this.name, 'Ad Shown Request');
    this.socket.emit('showedADS', null);
    if (this.reconector < 20) {
      this.reconector += 1;
      return this.montrAd();
    }
    this.reconector = 0;
    await DELAY(pause_before_disconnect);
    this.socket.disconnect()
    await DELAY(pause_before_reconnect);
    if (this.forseStop) return;
    this.openAndManageSocket()

  }



  openAndManageSocket() {
    this.socket = io('https://weomate.ru:82', {
      extraHeaders: {
        Host: "weomate.ru:82",
        Origin: "https://weomate.ru",
        "User-Agent": "Mozilla / 5.0( Linux; Android 6.0 .1; SM - Tg234 Build / MMB29K; wv ) AppleWebKit / 537.36( KHTML, like Gecko ) Version / 4.0 Chrome / 85.0 .4183 .127"
      }
    });


    this.socket.on('connect', () => {
      console.log(this.name, 'connect')

      this.socket.emit('authorization', this.url)
      this.montrAd()





    });

    this.socket.on('top_position', (data) => {
      this.socket.emit('my_top_position', data);
      this.topPlace = data;
      if (this.topPlace && this.topPlace <= max_top_position) {
        console.log(this.name, 'Достиг лимит топа');
        this.forseStop = true;
        this.socket.disconnect();
        this.socket = null;
        setTimeout(() => {
          this.forseStop = false;
          this.openAndManageSocket()
        }, 600e3);
      }
    })

    this.socket.on('SnackBarDone', (msg) => {
      console.log(this.name, msg)
    });
    this.socket.on('your_data', (msg) => {
      Account.accsMoney[this.name] = msg.iq;
      if (!(Math.round(this.timeLeft / 1000) % 10)) {
        console.log('   ');
        console.log(this.name, 'Iq:', msg.iq, 'Позиция:', this.topPlace, '    ', Math.round(this.timeLeft / 1000), '    ', 'Ущерб: ~', Account.countStolen() + ' р.');
      }


    });

    this.socket.on('disconnect', () => {
      console.log(this.name, 'disconnect')
      this.socket = null;
    });
  }
};

const getRndInteger = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const DELAY = ms => new Promise(_ => setTimeout(_, ms));

(async () => {
  for (let { name, url } of accounts) {

    new Account(name, url);

    await DELAY(5e3)
  }

})();












