// https://github.com/yagop/node-telegram-bot-api/issues/319#issuecomment-324963294
// Fixes an error with Promise cancellation
process.env.NTBA_FIX_319 = "test";
import fetch, { AbortError, FetchError } from "node-fetch";
import * as dotenv from "dotenv";
import TelegramBot from "node-telegram-bot-api";
dotenv.config();

const AbortController =
  globalThis.AbortController || (await import("abort-controller"));

const controller = new AbortController();

const timeout = setTimeout(() => {
  console.log("in timeout");
  controller.abort();
}, 10000);

async function getApiCall(id, bot, msg) {
  if (msg.split(".").length !== 2) {
    const message =
      "آدرست رو درست وارد کن. مثل این: something.antoher_thing \n آدرسی که وارد کردی: " +
      msg;
    console.log(message, id);
    return bot.sendMessage(id, message);
  }
  const url = "https://" + msg + ".dopraxrocks.net";
  try {
    const response = await fetch(url, {
      signal: controller.signal,
    });
    const body = await response.text();
    if (!body.includes("Welcome")) {
      // return getApiCall(id, bot, msg);
      return bot.sendMessage(id, 'سرور بالا نیست');
    }
    const message = "سرور بالاست." + "\n\n `" + msg + "`";
    return bot.sendMessage(id, message, { parse_mode: "Markdown" });
  } catch (error) {
    if (error instanceof AbortError) {
      console.log("request was aborted");
      return bot.sendMessage(id, 'تایم اوت');
      // return getApiCall(id, bot, msg);
    } else if (error instanceof FetchError) {
      console.log("fetch error");
      console.log(error.toString());
      const message = "آدرس اشتباه";
      return bot.sendMessage(id, message, { parse_mode: "Markdown" });
    } else {
      return bot.sendMessage(id, error.toString())
    }
  } finally {
    clearTimeout(timeout);
  }
}

export default async function handler(request, response) {
  try {
    const bot = new TelegramBot(process.env.BOT_TOKEN);

    const { body } = request;

    if (body && body.message) {
      const {
        chat: { id },
        text,
      } = body.message;

      await getApiCall(id, bot, text);
    }
  } catch (error) {
    console.error("Error sending message");
    console.log(error.toString());
  }
  response.send("OK");
}
