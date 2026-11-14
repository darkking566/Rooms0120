// Ending texts. endingText() picks the variant a finished run has earned; it reads the state but never changes it.

export const ENDINGS = {
  escape: {
    title: '— 逃脫結局 —',
    lines: [
      '你推開那扇門。',
      '……風。真正的、冷冷的風。',
      '你站在一條陌生的街上，天快要亮了。路燈還亮著——發出熟悉的嗡嗡聲。',
      '攝影機還在錄。你低頭看螢幕——畫面裡的街道，和你眼前的一模一樣。',
      '口袋裡多了一張紙條。是你自己的筆跡：',
      '「記錄 0120：已歸檔。下一次，請小心一點。」署名被水暈開了，只看得出一個 J。',
      '你試著想起 J.H. 是誰。你想起一條走廊、一盞燈、一個坐在牆角的人。……你想不起自己的名字。',
    ],
  },
  fall: {
    title: '— 墜落結局 —',
    lines: [
      '燈光暗下去的那一瞬間，你一腳踩空。',
      '下墜的時間長得不合理。',
      '你一直在等撞擊。',
      '它一直沒有來。',
    ],
  },
  red: {
    title: '— 紅房間結局 —',
    lines: [
      '你往紅光更深的地方走。',
      '轉過一個彎，又一個彎。每一個轉角後面，都是同一間紅色的房間。',
      '攝影機的螢幕早就只剩雜訊。',
      '你開始在牆上刻記號，好記住自己繞了幾圈。',
      '……正、正、正、正、正、正……',
    ],
  },
  archive: {
    title: '— 0120 —',
    lines: [
      '你把攝影機放進抽屜。紅燈還亮著。',
      '你關上抽屜。嗡嗡聲變得很遠、很遠。',
      '……',
      '在某個黃色的房間裡，有人醒了過來。',
      '牆上貼著一張皺巴巴的紙條。字跡……莫名地眼熟。',
    ],
  },
  thirst: {
    title: '— 脫水結局 —',
    lines: [
      '你的嘴唇裂開了，舌頭腫得說不出話。',
      '地毯吸飽了水，踩下去會冒出來。',
      '你跪下來，把臉貼在濕地毯上。',
      '那股鹹味，是你最後記得的東西。',
    ],
  },
  starve: {
    title: '— 飢餓結局 —',
    lines: [
      '你已經很多天沒有吃東西了。',
      '你蜷在牆角，數著燈管閃爍的次數，好忘記胃裡的痛。',
      '嗡嗡聲越來越遠。',
      '這一層不會讓你餓死。它只會讓你忘記自己為什麼要站起來。',
    ],
  },
  void: {
    title: '— 虛空結局 —',
    lines: [
      '你回頭。門口不在那裡了。',
      '沒有牆，沒有地板的邊，沒有聲音——連自己的腳步聲都沒有。',
      '你開始數步數。數到一萬的時候，你發現自己一直站在原地。',
      '攝影機的螢幕是黑的。不是沒電，是它也找不到任何東西可以錄。',
    ],
  },
  filed: {
    title: '— 記錄 0120：歸檔 —',
    lines: [
      '你按下輸入鍵。游標停止了閃爍。',
      '牆上所有的螢幕同時切換成同一個畫面：一間黃色的房間。',
      '有人在房間裡醒過來，摸到牆上一張皺巴巴的紙條。',
      '你看著他讀紙條。你知道他接下來會往哪裡走，會在哪裡停下來，會在哪裡哭。',
      '桌上有一疊紙和一支筆。',
      '你拿起筆。該寫下一張了。',
      '「如果你在讀這張紙條，代表你又『切出去』了。」',
    ],
  },
  lost: {
    title: '— 迷失結局 —',
    lines: [
      '嗡嗡聲越來越大，',
      '大到你分不清那是燈管，還是你自己的聲音。',
      '你靠著牆坐了下來。',
      '其實這裡……也沒那麼糟，對吧？',
    ],
  },
};

// The escape ending changes with what the player did on the way out.
export function endingText(kind, S) {
  const E = ENDINGS[kind];
  let title = E.title;
  let lines = E.lines.slice();
  if (kind === 'escape' && S.flags.rec === 'name') {
    // the true ending: the subject wrote their own name into record 0120
    title = '— 結案 —';
    lines = [
      '你推開那扇門。',
      '外面是真正的早晨。路燈已經熄了，沒有嗡嗡聲。',
      '攝影機的紅燈熄了。這一次，沒有人在錄。',
      '口袋裡的紙條是空白的。你把它留在門邊，給下一個需要它的人——不，你希望不會再有下一個人了。',
      '你記得自己的名字。你一路小聲念著它，走回家。',
    ];
    if (S.flags.freed_jh) lines.splice(3, 0, '街角有個人朝你點了點頭。他的臉終於對準了焦。然後他轉身，走進了人群。');
  } else if (kind === 'escape' && S.flags.freed_jh) {
    title = '— 歸檔結局 —';
    lines.splice(1, 0, '你身後傳來另一個腳步聲。你回頭——街上只有你一個人。可是地上有兩排腳印。');
    lines.splice(lines.length - 2, 2, '「記錄 0120：對象離開了。對象們離開了。」', '紙條背面還有一行小字：「下一次，換誰坐在牆角？」');
  } else if (kind === 'escape' && S.flags.met_jh) lines.splice(lines.length - 1, 0, '你想起馬尼拉房間牆角的那個人。他後來站起來了嗎？');
  if (kind === 'escape' && S.flags.rec === 'left') lines.splice(lines.length - 1, 0, '你想起監視室終端上那兩個自己冒出來的字：「未歸檔」。');
  if (kind === 'escape' && S.flags.rec !== 'name' && S.flags.wrote_start) lines.push('你在口袋裡摸到一截粉筆。你不記得自己把它帶出來了。');
  return { title, lines };
}
