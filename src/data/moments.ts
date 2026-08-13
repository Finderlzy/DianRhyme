export interface Moment {
  id: string;
  src: string;
  title?: string;
  description?: string;
  date?: string;
  location?: string;
}

const base = import.meta.env.BASE_URL;

export const moments: Moment[] = [
  {
    id: 'team-photo',
    src: `${base}images/team-photo.jpg`,
    title: '团队合影',
    description: '酉良和音滇韵民族团结实践团全体成员',
    date: '2026-08-08',
    location: '澜沧拉祜族自治县',
  },
  {
    id: 'day0',
    src: `${base}images/posts/7.26.jpg`,
    title: '落地澜沧',
    description: '实践日志第 0 天，初见这座西南边陲的音乐之城。',
    date: '2026-07-26',
    location: '澜沧拉祜族自治县',
  },
  {
    id: 'day1',
    src: `${base}images/posts/7.27.jpg`,
    title: '乐启澜沧，初见童真',
    description: '开课第一天，与澜沧的孩子们相遇。',
    date: '2026-07-27',
    location: '澜沧县特殊教育学校',
  },
  {
    id: 'day2',
    src: `${base}images/posts/7.28.jpg`,
    title: '歌声与微笑',
    description: '教室里歌声热烈，快门记录下一张张笑颜。',
    date: '2026-07-28',
    location: '澜沧县特殊教育学校',
  },
  {
    id: 'lancang',
    src: `${base}images/posts/7.29.png`,
    title: '走进澜沧',
    description: '认识这座西南边陲的音乐之城，闻名全国的"中国音乐村"。',
    date: '2026-07-29',
    location: '澜沧拉祜族自治县',
  },
  {
    id: 'summer',
    src: `${base}images/posts/7.30.jpg`,
    title: '夏日温暖瞬间',
    description: '镜头定格下孩子们最温暖的瞬间。',
    date: '2026-07-30',
    location: '澜沧拉祜族自治县',
  },
  {
    id: 'day3-4',
    src: `${base}images/posts/7.31.jpg`,
    title: '欢歌藏朝夕，温情见日常',
    description: '第三四天，课堂渐入佳境，孩子们唱得越来越自信。',
    date: '2026-07-31',
    location: '澜沧县特殊教育学校',
  },
  {
    id: 'week-review',
    src: `${base}images/posts/8.2.jpg`,
    title: '一周授课总结',
    description: '从初识简谱到完整合唱，孩子们的进步令人惊喜。',
    date: '2026-08-02',
    location: '澜沧县特殊教育学校',
  },
  {
    id: 'red-songs',
    src: `${base}images/posts/8.4.jpg`,
    title: '红色歌曲专题',
    description: '以音乐为媒，让红色基因在歌声里代代传承。',
    date: '2026-08-04',
    location: '澜沧县特殊教育学校',
  },
  {
    id: 'ethnic-songs',
    src: `${base}images/posts/8.8.jpg`,
    title: '民族歌曲专题',
    description: '通过藏族、蒙古族、朝鲜族歌曲，在歌声中传递民族团结的情谊。',
    date: '2026-08-08',
    location: '澜沧县特殊教育学校',
  },
  {
    id: 'team-up',
    src: `${base}images/posts/7.10.jpg`,
    title: '和音赴澜沧，芦笙遇少年',
    description: '跨越山海，队员们集结完毕，以音符为桥走进乡村美育课堂。',
    date: '2026-07-10',
    location: '北京',
  },
  {
    id: 'departure',
    src: `${base}images/posts/7.14.png`,
    title: '凝心启新程，和音赴滇乡',
    description: '第一次队员会记录，为奔赴滇乡的音乐支教之旅做好准备。',
    date: '2026-07-14',
    location: '北京',
  },
];
