import { Bot, InlineKeyboard, webhookCallback } from "grammy";

const ADMIN_ID = 8849773822;

const GOVS = {
  dictator: "✊ دیکتاتوری",
  democracy: "🗳️ دموکراسی",
  religious: "🕌 دینی (تئوکراسی)",
  monarch: "👑 سلطنتی",
  communist: "☭ کمونیستی",
  republic: "🏛️ جمهوری",
};

const GOV_SUBS = {
  dictator: {
    mil: ["🔒 دیکتاتوری نظامی", 25],
    personal: ["👑 دیکتاتوری فردی", 15],
  },
  democracy: {
    parl: ["📜 دموکراسی پارلمانی", 75],
    pres: ["🗳️ دموکراسی ریاستی", 70],
  },
  religious: {
    trad: ["🕌 تئوکراسی سنتی", 75],
    mod: ["⚖️ تئوکراسی میانه‌رو", 85],
    mil: ["🛡️ تئوکراسی نظامی-دینی", 55],
    legal: ["📜 تئوکراسی قانون‌گرا", 80],
    radical: ["💀 تئوکراسی افراطی", 20],
  },
  monarch: {
    abs: ["👑 سلطنت مطلقه", 20],
    const: ["🏛️ سلطنت مشروطه", 60],
  },
  communist: {
    one: ["☭ کمونیسم تک‌حزبی", 45],
  },
  republic: {
    sec: ["🏛️ جمهوری سکولار", 70],
  },
};

const RELIGIONS = {
  islam: "☪️ اسلام",
  christ: "✝️ مسیحیت",
  jew: "✡️ یهودیت",
  hindu: "🕉️ هندوئیسم",
  budd: "☸️ بودیسم",
  secular: "🕊️ سکولار",
};

const REL_SUBS = {
  islam: {
    shia12: "🔵 شیعه دوازده‌امامی",
    shia_ism: "🟢 شیعه اسماعیلی",
    shia_zayd: "🟡 شیعه زیدی",
    suni_hanafi: "🟠 سنی حنفی",
    suni_shafei: "🔴 سنی شافعی",
    suni_maleki: "🟣 سنی مالکی",
    suni_hanbali: "⚫ سنی حنبلی",
  },
  christ: {
    cath: "⛪ کاتولیک",
    orth: "🏛️ ارتدوکس",
    prot: "📖 پروتستان",
  },
  jew: {
    orth: "✡️ ارتدوکس",
    cons: "🕎 محافظه‌کار",
    ref: "📜 اصلاح‌طلب",
  },
  budd: {
    thera: "🟡 تراوادا",
    maha: "🔴 ماهایانا",
    vajra: "⚫ وجریانا",
  },
};

const EXPERTS = {
  heavy: "🏭 صنایع سنگین",
  energy: "⛽ سوخت و انرژی",
  grain: "🌾 غلات و کشاورزی",
  military: "🔫 صنایع نظامی",
};

const REGIONS = [
  "III", "GGG", "YYY", "OOO", "TTT",
  "FFF", "SSS", "AAA", "HHH", "KKK",
  "LLL", "RRR", "DDD", "WWW", "QQQ",
];

const temp = {};

function getTemp(uid) {
  if (!temp[uid]) temp[uid] = {};
  return temp[uid];
}

function buildRegionsKeyboard(takenRegions) {
  const kb = new InlineKeyboard();
  let count = 0;
  for (const code of REGIONS) {
    if (takenRegions.includes(code)) {
      kb.text(`🔒 ${code}`, "region_locked");
    } else {
      kb.text(`🟢 ${code}`, `region_${code}`);
    }
    count++;
    if (count % 3 === 0) kb.row();
  }
  return kb;
}

export default {
  async fetch(request, env, ctx) {
    const bot = new Bot(env.ENV_BOT_TOKEN);

    bot.command("start", async (ctx) => {
      const uid = ctx.from.id;
      const row = await env.DB.prepare(
        "SELECT status FROM countries WHERE user_id = ?"
      ).bind(uid).first();

      if (row) {
        if (row.status === "approved") {
          await ctx.reply("✅ کشور شما قبلاً تأیید شده. /menu را بزن.");
        } else {
          await ctx.reply("⏳ درخواست شما در حال بررسی ادمین است.");
        }
        return;
      }

      getTemp(uid).username = ctx.from.username || ctx.from.first_name;
      await ctx.reply(
        "🏛️ به بازی *جنگ متنی* خوش آمدی!\n\nلطفاً *نام کشور* خود را بنویس:",
        { parse_mode: "Markdown" }
      );
      temp[uid].step = "NAME";
    });

    bot.command("cancel", async (ctx) => {
      delete temp[ctx.from.id];
      await ctx.reply("❌ لغو شد. /start را بزن.");
    });

    bot.on("message:text", async (ctx) => {
      const uid = ctx.from.id;
      const text = ctx.message.text.trim();
      const t = temp[uid];
      if (!t || !t.step) return;

      if (t.step === "NAME") {
        if (text.length < 3 || text.length > 25) {
          await ctx.reply("❌ نام باید بین ۳ تا ۲۵ حرف باشد. دوباره بنویس:");
          return;
        }
        const exists = await env.DB.prepare(
          "SELECT 1 FROM countries WHERE name = ?"
        ).bind(text).first();
        if (exists) {
          await ctx.reply("❌ این نام قبلاً استفاده شده. نام دیگری بنویس:");
          return;
        }
        t.name = text;
        t.step = "LEADER";
        await ctx.reply("👤 *نام رهبر* را بنویس:", { parse_mode: "Markdown" });
        return;
      }

      if (t.step === "LEADER") {
        if (text.length < 2) {
          await ctx.reply("❌ نام خیلی کوتاهه. دوباره بنویس:");
          return;
        }
        t.leader = text;
        t.step = "AGE";
        await ctx.reply("🎂 *سن رهبر* را بنویس (بین ۳۵ تا ۴۵):", {
          parse_mode: "Markdown",
        });
        return;
      }

      if (t.step === "AGE") {
        if (!/^\d+$/.test(text)) {
          await ctx.reply("❌ فقط عدد بنویس (بین ۳۵ تا ۴۵):");
          return;
        }
        const age = parseInt(text);
        if (age < 35 || age > 45) {
          await ctx.reply("❌ سن باید بین ۳۵ تا ۴۵ باشد. دوباره بنویس:");
          return;
        }
        t.age = age;
        t.step = "REIGN";
        const kb = new InlineKeyboard()
          .text("⏳ ۵ سال", "reign_5").row()
          .text("⏳ ۱۰ سال", "reign_10").row()
          .text("⏳ ۲۰ سال", "reign_20").row()
          .text("⏳ ۳۰ سال", "reign_30").row()
          .text("♾️ مادام‌العمر", "reign_life");
        await ctx.reply("⏳ *مدت حکومت رهبر* را انتخاب کن:", {
          reply_markup: kb,
          parse_mode: "Markdown",
        });
        return;
      }
    });

    bot.on("callback_query:data", async (ctx) => {
      const data = ctx.callbackQuery.data;
      const uid = ctx.from.id;
      const t = getTemp(uid);

      if (data.startsWith("reign_")) {
        const map = {
          reign_5: "۵ سال", reign_10: "۱۰ سال", reign_20: "۲۰ سال",
          reign_30: "۳۰ سال", reign_life: "مادام‌العمر",
        };
        t.reign = map[data];
        t.step = "GOV";
        const kb = new InlineKeyboard();
        for (const [k, v] of Object.entries(GOVS)) {
          kb.text(v, `gov_${k}`).row();
        }
        await ctx.editMessageText("⚙️ *نوع حکومت* را انتخاب کن:", {
          reply_markup: kb,
          parse_mode: "Markdown",
        });
        return;
      }

      if (data.startsWith("gov_") && !data.startsWith("govsub_")) {
        const govKey = data.replace("gov_", "");
        t.gov = GOVS[govKey];
        t.step = "GOV_SUB";
        const kb = new InlineKeyboard();
        for (const [k, v] of Object.entries(GOV_SUBS[govKey])) {
          kb.text(v[0], `govsub_${govKey}_${k}`).row();
        }
        await ctx.editMessageText("🏛️ *باف حکومت* را انتخاب کن:", {
          reply_markup: kb,
          parse_mode: "Markdown",
        });
        return;
      }

      if (data.startsWith("govsub_")) {
        const parts = data.replace("govsub_", "").split("_");
        const govKey = parts[0];
        const subKey = parts.slice(1).join("_");
        const [subName, science] = GOV_SUBS[govKey][subKey];
        t.gov_sub = subName;
        t.science = science;
        t.step = "RELIGION";
        const kb = new InlineKeyboard();
        for (const [k, v] of Object.entries(RELIGIONS)) {
          kb.text(v, `rel_${k}`).row();
        }
        await ctx.editMessageText("☪️ *دین رسمی* را انتخاب کن:", {
          reply_markup: kb,
          parse_mode: "Markdown",
        });
        return;
      }

      if (data.startsWith("rel_") && !data.startsWith("relsub_")) {
        const relKey = data.replace("rel_", "");
        t.religion = RELIGIONS[relKey];
        if (relKey === "secular" || !REL_SUBS[relKey]) {
          t.rel_sub = "—";
          t.step = "EXPERT";
          const kb = new InlineKeyboard();
          for (const [k, v] of Object.entries(EXPERTS)) {
            kb.text(v, `exp_${k}`).row();
          }
          await ctx.editMessageText("🏭 *تخصص اقتصادی* را انتخاب کن:", {
            reply_markup: kb,
            parse_mode: "Markdown",
          });
          return;
        }
        t.step = "REL_SUB";
        const kb = new InlineKeyboard();
        for (const [k, v] of Object.entries(REL_SUBS[relKey])) {
          kb.text(v, `relsub_${relKey}_${k}`).row();
        }
        await ctx.editMessageText("📖 *مذهب* را انتخاب کن:", {
          reply_markup: kb,
          parse_mode: "Markdown",
        });
        return;
      }

      if (data.startsWith("relsub_")) {
        const parts = data.replace("relsub_", "").split("_");
        const relKey = parts[0];
        const subKey = parts.slice(1).join("_");
        t.rel_sub = REL_SUBS[relKey][subKey];
        t.step = "EXPERT";
        const kb = new InlineKeyboard();
        for (const [k, v] of Object.entries(EXPERTS)) {
          kb.text(v, `exp_${k}`).row();
        }
        await ctx.editMessageText("🏭 *تخصص اقتصادی* را انتخاب کن:", {
          reply_markup: kb,
          parse_mode: "Markdown",
        });
        return;
      }

      if (data.startsWith("exp_")) {
        const expKey = data.replace("exp_", "");
        t.expert = EXPERTS[expKey];
        t.step = "REGION";
        const taken = await env.DB.prepare("SELECT code FROM regions").all();
        const takenCodes = taken.results.map((r) => r.code);
        const kb = buildRegionsKeyboard(takenCodes);
        await ctx.editMessageText(
          "📍 *منطقه مورد نظر* را انتخاب کن:\n🔒 = گرفته شده",
          { reply_markup: kb, parse_mode: "Markdown" }
        );
        return;
      }

      if (data === "region_locked") {
        await ctx.answerCallbackQuery({
          text: "🔒 این منطقه قبلاً گرفته شده!",
          show_alert: true,
        });
        return;
      }

      if (data.startsWith("region_")) {
        const code = data.replace("region_", "");
        const check = await env.DB.prepare(
          "SELECT user_id FROM regions WHERE code = ?"
        ).bind(code).first();
        if (check) {
          await ctx.answerCallbackQuery({
            text: "🔒 این منطقه همین الان گرفته شد!",
            show_alert: true,
          });
          return;
        }
        t.region = code;
        t.step = "FLAG";
        await ctx.editMessageText(
          `✅ منطقه *${code}* انتخاب شد.\n\n🖼️ حالا *عکس پرچم کشور* را ارسال کن:`,
          { parse_mode: "Markdown" }
        );
        return;
      }

      if (data === "confirm_restart") {
        delete temp[uid];
        await ctx.editMessageCaption({ caption: "🔄 فرم پاک شد. /start را بزن." });
        return;
      }

      if (data === "confirm_yes") {
        const d = temp[uid];
        if (!d) {
          await ctx.editMessageCaption({ caption: "خطا! /start را بزن." });
          return;
        }
        const check = await env.DB.prepare(
          "SELECT user_id FROM regions WHERE code = ?"
        ).bind(d.region).first();
        if (check) {
          await ctx.editMessageCaption({
            caption: `❌ متأسفانه منطقه *${d.region}* همین الان گرفته شد.\n/start بزن و منطقه دیگری انتخاب کن.`,
            parse_mode: "Markdown",
          });
          delete temp[uid];
          return;
        }
        const adminText =
          `📥 *درخواست ثبت کشور جدید*\n\n` +
          `🏛️ کشور: ${d.name}\n` +
          `👤 رهبر: ${d.leader}\n` +
          `🎂 سن: ${d.age} سال\n` +
          `⏳ مدت حکومت: ${d.reign}\n` +
          `⚙️ حکومت: ${d.gov}\n` +
          `🏛️ باف: ${d.gov_sub}\n` +
          `☪️ دین: ${d.religion} — ${d.rel_sub}\n` +
          `🏭 تخصص: ${d.expert}\n` +
          `📍 منطقه: ${d.region}\n` +
          `🔬 علم: ${d.science}٪\n\n` +
          `👤 کاربر: @${d.username}\n` +
          `🆔 آیدی: \`${uid}\``;
        const kb = new InlineKeyboard()
          .text("✅ تأیید", `adm_ok_${uid}`).row()
          .text("❌ رد", `adm_no_${uid}`);
        await env.DB.prepare(
          "INSERT OR REPLACE INTO pending (user_id, data) VALUES (?, ?)"
        ).bind(uid, JSON.stringify(d)).run();
        await ctx.api.sendPhoto(ADMIN_ID, d.flag_id, {
          caption: adminText,
          reply_markup: kb,
          parse_mode: "Markdown",
        });
        await ctx.editMessageCaption({
          caption: "⏳ درخواست شما به ادمین ارسال شد. منتظر تأیید باش.",
        });
        return;
      }

      if (data.startsWith("adm_")) {
        if (uid !== ADMIN_ID) {
          await ctx.answerCallbackQuery({
            text: "⛔ فقط ادمین!",
            show_alert: true,
          });
          return;
        }
        const parts = data.split("_");
        const action = parts[1];
        const targetUid = parseInt(parts[2]);
        const row = await env.DB.prepare(
          "SELECT data FROM pending WHERE user_id = ?"
        ).bind(targetUid).first();
        if (!row) {
          await ctx.editMessageCaption({ caption: "❌ اطلاعات پیدا نشد." });
          return;
        }
        const d = JSON.parse(row.data);
        if (action === "ok") {
          await env.DB.prepare(
            "INSERT OR REPLACE INTO regions (code, user_id) VALUES (?, ?)"
          ).bind(d.region, targetUid).run();
          await env.DB.prepare(
            `INSERT OR REPLACE INTO countries
             (user_id, username, name, leader, age, reign, gov, gov_sub,
              religion, rel_sub, expert, region, flag_id, science, economy,
              happiness, army, revolt, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          ).bind(
            targetUid, d.username, d.name, d.leader, d.age, d.reign,
            d.gov, d.gov_sub, d.religion, d.rel_sub, d.expert,
            d.region, d.flag_id, d.science, 500, 60, 100, 5, "approved"
          ).run();
          await env.DB.prepare(
            "DELETE FROM pending WHERE user_id = ?"
          ).bind(targetUid).run();
          delete temp[targetUid];
          await ctx.editMessageCaption({
            caption: ctx.callbackQuery.message.caption + "\n\n✅ *تأیید شد*",
            parse_mode: "Markdown",
          });
          try {
            await ctx.api.sendMessage(
              targetUid,
              `🎉 تبریک! کشور *${d.name}* تأیید شد.\n📍 منطقه: ${d.region}\nبه‌زودی منوی اصلی فعال می‌شود.`,
              { parse_mode: "Markdown" }
            );
          } catch (e) {}
        } else {
          await env.DB.prepare(
            "DELETE FROM pending WHERE user_id = ?"
          ).bind(targetUid).run();
          delete temp[targetUid];
          await ctx.editMessageCaption({
            caption: ctx.callbackQuery.message.caption + "\n\n❌ *رد شد*",
            parse_mode: "Markdown",
          });
          try {
            await ctx.api.sendMessage(
              targetUid,
              "❌ متأسفانه درخواست کشورت رد شد.\nمی‌توانی دوباره با /start فرم پر کنی."
            );
          } catch (e) {}
        }
        return;
      }

      await ctx.answerCallbackQuery();
    });

    bot.on("message:photo", async (ctx) => {
      const uid = ctx.from.id;
      const t = temp[uid];
      if (!t || t.step !== "FLAG") return;
      const fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id;
      t.flag_id = fileId;
      t.step = "CONFIRM";
      const text =
        `🏛️ کشور: *${t.name}*\n` +
        `👤 رهبر: ${t.leader}\n` +
        `🎂 سن: ${t.age} سال\n` +
        `⏳ مدت حکومت: ${t.reign}\n` +
        `⚙️ حکومت: ${t.gov}\n` +
        `🏛️ باف: ${t.gov_sub}\n` +
        `☪️ دین: ${t.religion} — ${t.rel_sub}\n` +
        `🏭 تخصص: ${t.expert}\n` +
        `📍 منطقه: ${t.region}\n` +
        `🔬 علم: ${t.science}٪\n\n` +
        `آیا اطلاعات صحیح است؟`;
      const kb = new InlineKeyboard()
        .text("✅ ثبت نهایی", "confirm_yes").row()
        .text("🔄 شروع مجدد", "confirm_restart");
      await ctx.replyWithPhoto(fileId, {
        caption: text,
        reply_markup: kb,
        parse_mode: "Markdown",
      });
    });

    return webhookCallback(bot, "cloudflare-mod")(request);
  },
};
