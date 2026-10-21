# Third-party notices and credits

Ping is open source: https://github.com/adssaketh/Ping

## Spam protection data

Ping's on-device spam model is trained at build time from the **Indian Telecom SMS Spam Collection**,
created and shared by **junioralive**:

- GitHub: https://github.com/junioralive/india-spam-sms-classification
- Kaggle: https://www.kaggle.com/datasets/junioralive/india-spam-sms-classification
- Data file used: `dataset/spam_ham_india.csv`

The dataset is used under the terms in that repository's LICENSE file. Only word statistics derived from it ship
inside the app (`public/spam-model.json`); the raw messages are not included. The model is combined with a small
hand-written seed set (`scripts/spam-seed.csv`) and a list of scam patterns (`scripts/spam-rules.mjs`) written for
Ping. On the phone it also adapts to the user's own "Not spam" and "Report spam" choices.

## Software

Ping is built with open-source projects, each used under its own licence: React, Vite, Tailwind CSS, Motion,
Lucide icons and Capacitor.
