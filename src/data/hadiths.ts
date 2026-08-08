import type { HadithBook } from './types'

/** Стартовый набор хадисов – позже можно расширить / подключить API */
export const hadithBooks: HadithBook[] = [
  {
    id: 'nawawi-40',
    title: {
      ru: '40 хадисов ан-Навави',
      en: '40 Hadith of an-Nawawi',
    },
    narrator: {
      ru: 'Имам ан-Навави',
      en: 'Imam an-Nawawi',
    },
    hadiths: [
      {
        id: 'n1',
        number: 1,
        arabic:
          'إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى',
        text: {
          ru: 'Поистине, дела оцениваются только по намерениям, и каждому достанется лишь то, что он намеревался.',
          en: 'Actions are but by intention, and every person will have only what they intended.',
        },
      },
      {
        id: 'n2',
        number: 2,
        arabic:
          'أَنَّ رَجُلاً سَأَلَ النَّبِيَّ ﷺ: مَا الإِيمَانُ؟ … مَا الإِسْلاَمُ؟ … مَا الإِحْسَانُ؟',
        text: {
          ru: 'Джибриль спросил Пророка ﷺ об имане, исламе и ихсане. Он ответил: иман – вера в Аллаха, ангелов, Писания, посланников, Последний день и предопределение; ислам – свидетельство, намаз, закят, пост, хадж; ихсан – поклоняться Аллаху так, будто ты видишь Его.',
          en: 'Jibril asked the Prophet ﷺ about iman, islam, and ihsan. He said: iman is belief in Allah, angels, books, messengers, the Last Day and decree; islam is the testimony, prayer, zakat, fasting, hajj; ihsan is to worship Allah as if you see Him.',
        },
      },
      {
        id: 'n3',
        number: 3,
        arabic: 'بُنِيَ الإِسْلاَمُ عَلَى خَمْسٍ',
        text: {
          ru: 'Ислам построен на пяти: свидетельстве, что нет бога, кроме Аллаха, и что Мухаммад – Его посланник; намазе; закяте; хадже; посте в Рамадан.',
          en: 'Islam is built on five: the testimony that there is no god but Allah and Muhammad is His messenger; prayer; zakat; hajj; and fasting Ramadan.',
        },
      },
      {
        id: 'n4',
        number: 4,
        arabic:
          'إِنَّ أَحَدَكُمْ يُجْمَعُ خَلْقُهُ فِي بَطْنِ أُمِّهِ أَرْبَعِينَ يَوْمًا',
        text: {
          ru: 'Каждый из вас собирается в утробе матери сорок дней… затем посылается ангел, который записывает удел, срок, дела и счастлив он или несчастен.',
          en: 'Each of you is gathered in the womb for forty days… then an angel is sent who writes provision, lifespan, deeds, and whether he will be happy or unhappy.',
        },
      },
      {
        id: 'n5',
        number: 5,
        arabic:
          'مَنْ أَحْدَثَ فِي أَمْرِنَا هَذَا مَا لَيْسَ مِنْهُ فَهُوَ رَدٌّ',
        text: {
          ru: 'Кто внесёт в наше дело то, что к нему не относится – оно будет отвергнуто.',
          en: 'Whoever introduces into this matter of ours that which is not from it, it is rejected.',
        },
      },
      {
        id: 'n6',
        number: 6,
        arabic: 'الحَلَالُ بَيِّنٌ وَالحَرَامُ بَيِّنٌ',
        text: {
          ru: 'Дозволенное ясно, и запретное ясно, а между ними сомнительное. Кто избегает сомнительного, оберегает свою религию.',
          en: 'The lawful is clear and the unlawful is clear, and between them are doubtful matters. Whoever avoids the doubtful protects his religion.',
        },
      },
      {
        id: 'n13',
        number: 13,
        arabic:
          'لَا يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ',
        text: {
          ru: 'Не уверует никто из вас, пока не полюбит для своего брата того же, чего желает себе.',
          en: 'None of you believes until he loves for his brother what he loves for himself.',
        },
      },
      {
        id: 'n15',
        number: 15,
        arabic:
          'مَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَاليَوْمِ الآخِرِ فَلْيَقُلْ خَيْرًا أَوْ لِيَصْمُتْ',
        text: {
          ru: 'Кто верует в Аллаха и в Последний день, пусть говорит благое или молчит.',
          en: 'Whoever believes in Allah and the Last Day, let him speak good or remain silent.',
        },
      },
      {
        id: 'n19',
        number: 19,
        arabic:
          'احْفَظِ اللَّهَ يَحْفَظْكَ، احْفَظِ اللَّهَ تَجِدْهُ تُجَاهَكَ',
        text: {
          ru: 'Храни Аллаха – и Он сохранит тебя. Храни Аллаха – и найдёшь Его перед собой.',
          en: 'Be mindful of Allah and He will protect you. Be mindful of Allah and you will find Him before you.',
        },
      },
      {
        id: 'n40',
        number: 40,
        arabic: 'كُنْ فِي الدُّنْيَا كَأَنَّكَ غَرِيبٌ أَوْ عَابِرُ سَبِيلٍ',
        text: {
          ru: 'Будь в этом мире как странник или путник.',
          en: 'Be in this world as if you were a stranger or a traveler on a path.',
        },
      },
    ],
  },
  {
    id: 'bukhari-selected',
    title: {
      ru: 'Избранное из аль-Бухари',
      en: 'Selected from al-Bukhari',
    },
    narrator: {
      ru: 'Сахих аль-Бухари',
      en: 'Sahih al-Bukhari',
    },
    hadiths: [
      {
        id: 'b1',
        number: 1,
        text: {
          ru: 'Поистине, дела оцениваются по намерениям… (начало сборника).',
          en: 'Actions are according to intentions… (opening of the collection).',
        },
      },
      {
        id: 'b8',
        number: 8,
        text: {
          ru: 'Ислам построен на пяти столпах…',
          en: 'Islam is built upon five…',
        },
      },
      {
        id: 'b13',
        number: 13,
        text: {
          ru: 'Не уверует никто из вас, пока не полюбит для своего брата (или: соседа) того же, чего желает себе.',
          en: 'None of you believes until he loves for his brother (or: neighbor) what he loves for himself.',
        },
      },
      {
        id: 'b6018',
        number: 6018,
        text: {
          ru: 'Тот, кто не проявляет милосердия, не будет помилован.',
          en: 'He who does not show mercy will not be shown mercy.',
        },
      },
    ],
  },
]

export function getHadithBook(id: string) {
  return hadithBooks.find((b) => b.id === id)
}
