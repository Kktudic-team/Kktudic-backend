const express = require('express')
const app = express()
const cors = require('cors')
const port = 3000

app.use(cors({
  origin: ['https://kktudic-frontend.vercel.app', 'https://kkutuword.com/']
}))

app.listen(port, () => {
  console.log(`Running on http://localhost:${port}`)
})

const fs = require('fs');
// 중복 단어를 제거하는 함수
const removeDuplicates = arr => {
  return [...new Set(arr.map(word => word.trim()))];
};

function sortword() {
  let words = fs.readFileSync('words.txt', 'utf-8').split('\n');

  // 중복 단어 제거
  words = removeDuplicates(words);
  const sortWordsByLength = words => {
    return words.sort((a, b) => {
      if (a.length === b.length) {
        return a.localeCompare(b);
      } else {
        return b.length - a.length;
      }
    });
  };

  words = sortWordsByLength(words);

  fs.writeFileSync('words.txt', words.join('\n'));
}
sortword();

const getWords = (firstLetter, secondLetter) => {
  let time = 0
  const startTime = Date.now();
  let filteredWords = fs.readFileSync('words.txt', 'utf-8').split('\n');
  filteredWords = filteredWords.filter(word => word.startsWith(firstLetter.toString().trim()));
  let sortedWords = [];
  let words = [];
  let count = [];
  if (secondLetter && secondLetter.trim()) {
    sortedWords = filteredWords.sort((a, b) => b.split(secondLetter.toString().trim()).length - a.split(secondLetter.toString().trim()).length);
  } else {
    sortedWords = filteredWords;
  }
  sortedWords.forEach(word => {
    let c = 0;
    if (secondLetter && secondLetter.trim() && word.includes(secondLetter.toString().trim())) {
      c = word.split(secondLetter.toString().trim()).length - 1;
    }
    words.push(word);
    count.push(c);
  });
  time = (Date.now() - startTime) / 1000
  return [[words, count], time];
};

app.use(express.json());

app.post('/api/submit', (req, res) => {
  try {
    const [result, time] = getWords(req.body.startWord, req.body.missionWord);
    res.send({ word: result[0], count: result[1], time: time });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: err.message });
  }
});

app.get('/api/notices', (req, res) => {
  fs.readFile('notice.txt', 'utf8', (err, data) => {
    if (err) {
      res.status(500).send(err);
      return;
    }

    const notices = data.split('\r\n\r\n');
    const titles = [];
    const details = [];
    const dates = [];

    notices.forEach((notice) => {
      const [title, ...contentDate] = notice.split('\n');
      const [content, date] = contentDate;
      titles.push(title);
      details.push(content);
      dates.push(date.trim());
    });

    const result = titles.map((title, i) => ({
      id: i + 1,
      title,
      detail: details[i],
      createdAt: dates[i],
    }));
    res.json(result);
  });
});

app.get('/api/notices/:id', (req, res) => {
  const id = Number(req.params.id);
  fs.readFile('notice.txt', 'utf8', (err, data) => {
    if (err) {
      res.status(500).send(err);
      return;
    }

    const notices = data.split('\r\n\r\n');
    if (id < 1 || id > notices.length) {
      res.status(404).send(`Notice with ID ${id} not found`);
      return;
    }

    const titles = [];
    const details = [];
    const dates = [];

    notices.forEach((notice) => {
      const [title, ...contentDate] = notice.split('\n');
      let [content, date] = contentDate;
      if (!date) {
        date = '';
      }
      titles.push(title);
      details.push(content.replace(/\n/g, '<br>')); // 개행 문자를 <br> 태그로 대체
      dates.push(date.trim());
    });

    const notice = notices[id - 1];
    const [title, content, createdAt] = notice.split('\n');
    const result = {
      id,
      title,
      content,
      createdAt: createdAt.trim()
    };
    res.json(result);
  });
});
