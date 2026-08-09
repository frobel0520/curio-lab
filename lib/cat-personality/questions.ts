import type { QuizQuestion } from "./types";

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: "q01",
    title: "新紙箱來了",
    prompt: "看到剛拆完的紙箱，牠會……",
    options: [
      { id: "a", text: "等安靜後，再研究開口和摺角。", scores: ["I", "N"] },
      { id: "b", text: "直接坐進去，等你陪牠玩。", scores: ["E", "S"] },
      { id: "c", text: "聞過一圈，把它當藏身處。", scores: ["I", "S"] },
      { id: "d", text: "拉你一起，把紙箱玩出新花樣。", scores: ["E", "N"] },
    ],
  },
  {
    id: "q02",
    title: "你換了房間",
    prompt: "你從客廳走進房間，牠會……",
    options: [
      { id: "a", text: "跟過去，待在熟悉的位置。", scores: ["E", "J"] },
      { id: "b", text: "留在原處或回固定休息區。", scores: ["I", "J"] },
      { id: "c", text: "跟過去，順便發起互動。", scores: ["E", "P"] },
      { id: "d", text: "自己走開，臨時找別的事。", scores: ["I", "P"] },
    ],
  },
  {
    id: "q03",
    title: "零食卡住了",
    prompt: "零食卡在益智玩具裡，牠會……",
    options: [
      { id: "a", text: "翻面、換方向，測試不同機關。", scores: ["N", "T"] },
      { id: "b", text: "看著你，照熟悉的方法繼續。", scores: ["S", "F"] },
      { id: "c", text: "反覆拍、推或咬，直到拿到。", scores: ["S", "T"] },
      { id: "d", text: "邊試新方法，邊找你幫忙。", scores: ["N", "F"] },
    ],
  },
  {
    id: "q04",
    title: "逗貓棒停了",
    prompt: "玩到一半，逗貓棒不動了，牠會……",
    options: [
      { id: "a", text: "回到你身旁，等原本玩法繼續。", scores: ["F", "J"] },
      { id: "b", text: "換個目標或玩法，繼續狩獵。", scores: ["T", "P"] },
      { id: "c", text: "守著原玩具，要求繼續。", scores: ["T", "J"] },
      { id: "d", text: "跟著你，改玩別的。", scores: ["F", "P"] },
    ],
  },
  {
    id: "q05",
    title: "你回家了",
    prompt: "獨處一段時間後看到你回家，牠會……",
    options: [
      { id: "a", text: "立刻到門口迎接，一路跟著你。", scores: ["E"] },
      { id: "b", text: "先遠遠看，過一會兒才靠近。", scores: ["I"] },
      { id: "c", text: "走到同一空間，有機會就互動。", scores: ["E"] },
      { id: "d", text: "繼續原本活動，晚點再出現。", scores: ["I"] },
    ],
  },
  {
    id: "q06",
    title: "家具換位置",
    prompt: "客廳家具重新排列，牠會……",
    options: [
      { id: "a", text: "把新格局當遊樂場，到處試路線。", scores: ["N", "P"] },
      { id: "b", text: "先走原本路線，確認熟悉位置。", scores: ["S", "J"] },
      { id: "c", text: "逐一聞過、踩過，再慢慢調整。", scores: ["S", "P"] },
      { id: "d", text: "先看完整體，再選定新路線。", scores: ["N", "J"] },
    ],
  },
  {
    id: "q07",
    title: "你正在忙",
    prompt: "牠想玩，但你正忙著，牠會……",
    options: [
      { id: "a", text: "帶玩具來或直接叫你陪玩。", scores: ["E", "T"] },
      { id: "b", text: "靠近或磨蹭，等互動機會。", scores: ["E", "F"] },
      { id: "c", text: "自己找玩具，獨立開玩。", scores: ["I", "T"] },
      { id: "d", text: "安靜待在附近，等你有空。", scores: ["I", "F"] },
    ],
  },
  {
    id: "q08",
    title: "門突然開了",
    prompt: "平常關著的門突然打開，牠會……",
    options: [
      { id: "a", text: "先走完原路線，再去查看。", scores: ["S", "J"] },
      { id: "b", text: "馬上探索門後的各種路線。", scores: ["N", "P"] },
      { id: "c", text: "先看清全貌，再安排新路線。", scores: ["N", "J"] },
      { id: "d", text: "聞聞門框和地面，再決定下一步。", scores: ["S", "P"] },
    ],
  },
  {
    id: "q09",
    title: "位子被占了",
    prompt: "牠最愛的位置被你占走，牠會……",
    options: [
      { id: "a", text: "在你附近另找新位置。", scores: ["F", "P"] },
      { id: "b", text: "明確要求拿回原位。", scores: ["T", "J"] },
      { id: "c", text: "立刻找另一個好位置。", scores: ["T", "P"] },
      { id: "d", text: "留在附近，等著和你共享。", scores: ["F", "J"] },
    ],
  },
  {
    id: "q10",
    title: "陌生物品",
    prompt: "看到安全但陌生的東西，牠會……",
    options: [
      { id: "a", text: "先確認氣味、材質和用途。", scores: ["S"] },
      { id: "b", text: "用熟悉方式碰觸，慢慢檢查。", scores: ["S"] },
      { id: "c", text: "研究特殊角度或隱藏部分。", scores: ["N"] },
      { id: "d", text: "很快玩出幾種新花樣。", scores: ["N"] },
    ],
  },
  {
    id: "q11",
    title: "陌生房間",
    prompt: "第一次進入陌生房間，牠會……",
    options: [
      { id: "a", text: "跟著你進去，先看高處和角落。", scores: ["E", "N"] },
      { id: "b", text: "等安靜後，從地面和氣味查起。", scores: ["I", "S"] },
      { id: "c", text: "待在你附近，先看眼前物品。", scores: ["E", "S"] },
      { id: "d", text: "在門口觀察，再鎖定特殊角落。", scores: ["I", "N"] },
    ],
  },
  {
    id: "q12",
    title: "沙發下有聲音",
    prompt: "沙發下突然傳出怪聲，牠會……",
    options: [
      { id: "a", text: "猜測移動方向，邀你一起查看。", scores: ["N", "F"] },
      { id: "b", text: "盯準來源，直接伸手確認。", scores: ["S", "T"] },
      { id: "c", text: "預測出口，測試不同攔截法。", scores: ["N", "T"] },
      { id: "d", text: "先找準位置，再看你的反應。", scores: ["S", "F"] },
    ],
  },
  {
    id: "q13",
    title: "家裡安靜了",
    prompt: "原本熱鬧的家突然安靜，牠會……",
    options: [
      { id: "a", text: "去熟悉的位置找人。", scores: ["E", "J"] },
      { id: "b", text: "回固定的安靜角落休息。", scores: ["I", "J"] },
      { id: "c", text: "到不同房間找人互動。", scores: ["E", "P"] },
      { id: "d", text: "趁機獨自探索各個角落。", scores: ["I", "P"] },
    ],
  },
  {
    id: "q14",
    title: "你心情不好",
    prompt: "你低落地回到家，牠會……",
    options: [
      { id: "a", text: "照常做自己的事，等你找牠。", scores: ["I", "T"] },
      { id: "b", text: "主動靠近，安靜陪著你。", scores: ["E", "F"] },
      { id: "c", text: "主動討玩或討飯，維持日常節奏。", scores: ["E", "T"] },
      { id: "d", text: "不打擾，但待在看得到你的地方。", scores: ["I", "F"] },
    ],
  },
  {
    id: "q15",
    title: "牠想要東西",
    prompt: "想開門、拿玩具或請你幫忙時，牠會……",
    options: [
      { id: "a", text: "走到目標旁，直接指出需求。", scores: ["T"] },
      { id: "b", text: "先磨蹭或輕叫，再帶你過去。", scores: ["F"] },
      { id: "c", text: "先自己試，做不到才求助。", scores: ["T"] },
      { id: "d", text: "先和你互動，再引導你理解。", scores: ["F"] },
    ],
  },
  {
    id: "q16",
    title: "新的貓跳台",
    prompt: "第一次看到新貓跳台，牠會……",
    options: [
      { id: "a", text: "先看整體，再固定一條路線。", scores: ["N", "J"] },
      { id: "b", text: "逐層踩聞，隨感受調整。", scores: ["S", "P"] },
      { id: "c", text: "從底層依序確認，再固定使用。", scores: ["S", "J"] },
      { id: "d", text: "嘗試各種入口和跳法。", scores: ["N", "P"] },
    ],
  },
  {
    id: "q17",
    title: "晚餐遲到了",
    prompt: "超過吃飯時間，晚餐還沒來，牠會……",
    options: [
      { id: "a", text: "守在固定地點，要求準時開飯。", scores: ["T", "J"] },
      { id: "b", text: "先找你陪伴，再看看別的活動。", scores: ["F", "P"] },
      { id: "c", text: "換不同方法找食物或提醒你。", scores: ["T", "P"] },
      { id: "d", text: "跟在你附近，用熟悉方式提醒。", scores: ["F", "J"] },
    ],
  },
  {
    id: "q18",
    title: "門關著",
    prompt: "牠想進房間，但門關著，牠會……",
    options: [
      { id: "a", text: "安靜研究門縫或其他入口。", scores: ["I", "T"] },
      { id: "b", text: "靠近你磨蹭，請你一起處理。", scores: ["E", "F"] },
      { id: "c", text: "直接叫你或拍門，直到打開。", scores: ["E", "T"] },
      { id: "d", text: "默默守在附近，等你懂牠。", scores: ["I", "F"] },
    ],
  },
  {
    id: "q19",
    title: "新的玩具",
    prompt: "看到從沒玩過的新玩具，牠會……",
    options: [
      { id: "a", text: "自己聞摸，確認材質和玩法。", scores: ["I", "S"] },
      { id: "b", text: "拉你一起研究，發明新玩法。", scores: ["E", "N"] },
      { id: "c", text: "跟著你的動作，直接追打。", scores: ["E", "S"] },
      { id: "d", text: "先遠遠看，再研究特殊角度。", scores: ["I", "N"] },
    ],
  },
  {
    id: "q20",
    title: "睡在哪裡",
    prompt: "牠平常選睡覺位置時，比較像……",
    options: [
      { id: "a", text: "固定時間，回到固定位置。", scores: ["J"] },
      { id: "b", text: "在幾個熟悉位置規律輪替。", scores: ["J"] },
      { id: "c", text: "看陽光、溫度或聲音彈性選擇。", scores: ["P"] },
      { id: "d", text: "常睡在不同或意外的新地方。", scores: ["P"] },
    ],
  },
];
