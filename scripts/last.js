// Description:
//   Messing around with the today API.
// Commands:
//   hubot today  - Return today at random.

const Sequelize = require('sequelize');

let DB_INFO = "postgres://last:ne201094@localhost:5432/last";
let pg_option = {};
let i = 1;

if (process.env.DATABASE_URL) {
  console.log("running on Heroku");
  DB_INFO = process.env.DATABASE_URL;
  pg_option = { ssl: { rejectUnauthorized: false } };
}

const sequelize = new Sequelize(DB_INFO, {
  dialect: 'postgres',
  dialectOptions: pg_option
});

const Logs = sequelize.define('lasts', {
  id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
  user_id: Sequelize.TEXT,
  user_name: Sequelize.TEXT,
  message: Sequelize.TEXT,
  time: Sequelize.INTEGER
},
  {
    freezeTableName: true   // stick to the table name we defined
  }
);

sequelize.sync({ force: false, alter: true })
  .then((mes) => { console.log("start"); })
  .catch((mes) => {
    //console.log(mes);
    console.log("db connection error");
  });

module.exports = (robot) => {
  robot.respond(/WILL$/i, (res) => {
    res.send({
      question: '今日勉強するのは..?',
      options: ['課題', 'インフラ', 'セキュリティ', 'プログラミング'],
      closing_type: 0  // (Option) 誰かが回答:0, 全員が回答:1
    });
  });
  robot.respond(/LOGS$/i, (res) => {
    let ave = 0;
    let all_time = 0;
    let cnt = 0;
    Logs.findAll()
      .then((result) => {
        let allMessages = result.map((e) => {
          let createdAt = new Date(e.createdAt);
          let timeStamp = createdAt.toLocaleDateString() + " " + createdAt.toLocaleTimeString();
          if(e.time != null){
            all_time += e.time;
            cnt += 1;
          }
          return "[" + timeStamp + "]:　" + e.message + "\n学習時間　" + e.time + "分\n";
        });
        ave = all_time/cnt;
        res.send(
          allMessages.join('\n') + "\n" + "平均時間は、" + ave + "分です。",
        );
      });
  });
  robot.respond(/AVE$/i, (res) => {
    let ave = 0;
    let all_time = 0;
    let cnt = 0;
    let text;
    let index;
    Logs.findAll()
      .then((result) => {
        result.map((e) => {
          if(e.time != null){
            all_time += e.time;
            cnt += 1;
          }
        });
        ave = all_time/cnt;
        if(ave >= 240){
          text = "いいねいいね";
          index = "1152921507291203528";
        }else if(ave >= 180){
          text = "3時間越え!★";
          index = "1152921507291203535";
        }else if(ave >= 120){
          text = "まだまだできるはず。";
          index = "1152921507291203850";
        }else{
          text = "勉強勉強勉強勉強勉強勉強勉強";
          index = "1152921507291203869";
        }
        res.send({
          stamp_set: "3",
          stamp_index: index,
          text: "平均学習時間：" + ave + "分" + "\n" + text
        });
      });
  });
  robot.hear(/(.*)$/, (res) => {
    // console.log(res);
    mes = res.match[0].slice(6);
    // console.log(mes);
    time = mes.indexOf(":") + 1;
    // console.log(mes.substring(time));
    let printcmd = /PRINT$/i;
    console.log(printcmd.test(res.match[0].slice(6)));
    if (!printcmd.test(res.match[0].slice(6))) {
      let newLog = new Logs({
        user_id: res.message.user.id,
        user_name: res.message.user.displayName,
        message: res.match[0].slice(6),
        time: mes.substring(time)
      });
      newLog.save()
        .then((mes) => {
          //console.log(mes);
        })
        .catch((mes) => {
          console.log(mes);
        });
    }
  });
  robot.respond(/PRINT$/i, (res) => {
    let ave = 0;
    let all_time = 0;
    let cnt = 0;
    let text;
    Logs.findAll()
      .then((result) => {
        let allMessages = result.map((e) => {
          let createdAt = new Date(e.createdAt);
          let timeStamp = createdAt.toLocaleDateString() + " " + createdAt.toLocaleTimeString();
          if(e.time != null){
            all_time += e.time;
            cnt += 1;
          }
          return e.user_name + "[" + timeStamp + "]:" + e.message + "学習時間" + e.time + "分";
        });
        ave = all_time/cnt;
        if(ave >= 240){
          text = "素晴らしい！！";
        }else if(ave >= 180){
          text = "その調子!";
        }else if(ave >= 120){
          text = "もうちょっと勉強の時間を作ろう！";
        }else{
          text = "勉強勉強勉強勉強勉強勉強勉強";
        }
        res.send({
          note_title: `学習記録${i}`,
          note_content: allMessages.join('\n') + "\n" + "平均時間は、" + ave + "分です。"+ "\n" + text,
          onsend: (sent) => {
            console.log(allMessages.join('\n'));
            console.log(`note title: ${sent.note.noteRevision.title}`);
            console.log(`note content: ${sent.note.noteRevision.contentText}`);
          }
        });
        i = i+1;
      });
  });
  robot.respond(/CLEAR$/i, (res) => {
    Logs.destroy({ where: {} })
      .then((mes) => {
        console.log("db cleared");
      })
      .catch((mes) => {
        console.log(mes);
      });
  });
}