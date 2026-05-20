export type Locale =
  | 'es'
  | 'en'
  | 'pt'
  | 'fr'
  | 'de'
  | 'it'
  | 'zh'
  | 'ja'
  | 'ko'
  | 'ar';

export type TranslationKeys = {
  nav: { attendance: string; teams: string; sessions: string };
  hero: {
    eyebrow: string;
    title: string;
    description: string;
    cta: string;
    ctaSecondary: string;
  };
  card: {
    todayTraining: string;
    quickList: string;
  };
  status: { present: string; absent: string; late: string };
  sport: { football: string; basketball: string; volleyball: string; rugby: string };
  metrics: {
    activeAthletes: string;
    weeklyAttendance: string;
    registeredTeams: string;
  };
  sessions: {
    eyebrow: string;
    title: string;
  };
  sessionData: {
    techniqueAndMobility: string;
    zoneDefense: string;
    blockAndReception: string;
    sub16Football: string;
    womenBasketball: string;
    mixedVolleyball: string;
    today: string;
    tomorrow: string;
    friday: string;
  };
  accent: {
    eyebrow: string;
    title: string;
    description: string;
    cta: string;
  };
};

export const localeNames: Record<Locale, string> = {
  es: 'Español',
  en: 'English',
  pt: 'Português',
  fr: 'Français',
  de: 'Deutsch',
  it: 'Italiano',
  zh: '中文',
  ja: '日本語',
  ko: '한국어',
  ar: 'العربية',
};

const translations: Record<Locale, TranslationKeys> = {
  es: {
    nav: { attendance: 'Asistencia', teams: 'Equipos', sessions: 'Sesiones' },
    hero: {
      eyebrow: 'Gestion deportiva multi-deporte',
      title: 'Controla asistencia, equipos y entrenamientos desde un solo lugar.',
      description:
        'Sportia ayuda a entrenadores y clubes a saber quien entreno, que sesiones vienen y como evoluciona la participacion de cada equipo.',
      cta: 'Ver asistencia',
      ctaSecondary: 'Planificar sesion',
    },
    card: { todayTraining: 'Entrenamiento de hoy', quickList: 'Lista rapida' },
    status: { present: 'Presente', absent: 'Ausente', late: 'Tarde' },
    sport: { football: 'Futbol', basketball: 'Basquet', volleyball: 'Voley', rugby: 'Rugby' },
    metrics: {
      activeAthletes: 'Deportistas activos',
      weeklyAttendance: 'Asistencia semanal',
      registeredTeams: 'Equipos registrados',
    },
    sessions: { eyebrow: 'Agenda', title: 'Proximas sesiones' },
    sessionData: {
      techniqueAndMobility: 'Tecnica y movilidad',
      zoneDefense: 'Defensa en zona',
      blockAndReception: 'Bloqueo y recepcion',
      sub16Football: 'Sub 16 futbol',
      womenBasketball: 'Basquet femenino',
      mixedVolleyball: 'Voley mixto',
      today: 'Hoy, 18:30',
      tomorrow: 'Manana, 10:00',
      friday: 'Viernes, 19:00',
    },
    accent: {
      eyebrow: 'Siguiente paso',
      title: 'Primer modulo listo para conectar datos reales.',
      description:
        'Esta base deja preparada la experiencia principal: registrar asistencia, visualizar indicadores y ordenar entrenamientos por deporte o equipo.',
      cta: 'Empezar carga',
    },
  },

  en: {
    nav: { attendance: 'Attendance', teams: 'Teams', sessions: 'Sessions' },
    hero: {
      eyebrow: 'Multi-sport management',
      title: 'Track attendance, teams and training from one place.',
      description:
        'Sportia helps coaches and clubs know who trained, which sessions are next and how each team\'s participation evolves.',
      cta: 'View attendance',
      ctaSecondary: 'Plan session',
    },
    card: { todayTraining: 'Today\'s training', quickList: 'Quick list' },
    status: { present: 'Present', absent: 'Absent', late: 'Late' },
    sport: { football: 'Football', basketball: 'Basketball', volleyball: 'Volleyball', rugby: 'Rugby' },
    metrics: {
      activeAthletes: 'Active athletes',
      weeklyAttendance: 'Weekly attendance',
      registeredTeams: 'Registered teams',
    },
    sessions: { eyebrow: 'Schedule', title: 'Upcoming sessions' },
    sessionData: {
      techniqueAndMobility: 'Technique & mobility',
      zoneDefense: 'Zone defense',
      blockAndReception: 'Block & reception',
      sub16Football: 'U-16 football',
      womenBasketball: 'Women\'s basketball',
      mixedVolleyball: 'Mixed volleyball',
      today: 'Today, 18:30',
      tomorrow: 'Tomorrow, 10:00',
      friday: 'Friday, 19:00',
    },
    accent: {
      eyebrow: 'Next step',
      title: 'First module ready to connect real data.',
      description:
        'This foundation prepares the core experience: logging attendance, viewing indicators and sorting training by sport or team.',
      cta: 'Start loading',
    },
  },

  pt: {
    nav: { attendance: 'Presença', teams: 'Equipes', sessions: 'Sessões' },
    hero: {
      eyebrow: 'Gestão esportiva multi-esporte',
      title: 'Controle presença, equipes e treinos em um só lugar.',
      description:
        'Sportia ajuda treinadores e clubes a saber quem treinou, quais sessões vêm e como evolui a participação de cada equipe.',
      cta: 'Ver presença',
      ctaSecondary: 'Planejar sessão',
    },
    card: { todayTraining: 'Treino de hoje', quickList: 'Lista rápida' },
    status: { present: 'Presente', absent: 'Ausente', late: 'Atrasado' },
    sport: { football: 'Futebol', basketball: 'Basquete', volleyball: 'Vôlei', rugby: 'Rugby' },
    metrics: {
      activeAthletes: 'Atletas ativos',
      weeklyAttendance: 'Presença semanal',
      registeredTeams: 'Equipes registradas',
    },
    sessions: { eyebrow: 'Agenda', title: 'Próximas sessões' },
    sessionData: {
      techniqueAndMobility: 'Técnica e mobilidade',
      zoneDefense: 'Defesa em zona',
      blockAndReception: 'Bloqueio e recepção',
      sub16Football: 'Sub 16 futebol',
      womenBasketball: 'Basquete feminino',
      mixedVolleyball: 'Vôlei misto',
      today: 'Hoje, 18:30',
      tomorrow: 'Amanhã, 10:00',
      friday: 'Sexta, 19:00',
    },
    accent: {
      eyebrow: 'Próximo passo',
      title: 'Primeiro módulo pronto para conectar dados reais.',
      description:
        'Esta base prepara a experiência principal: registrar presença, visualizar indicadores e organizar treinos por esporte ou equipe.',
      cta: 'Começar carga',
    },
  },

  fr: {
    nav: { attendance: 'Présence', teams: 'Équipes', sessions: 'Séances' },
    hero: {
      eyebrow: 'Gestion sportive multi-sport',
      title: 'Suivez présence, équipes et entraînements depuis un seul endroit.',
      description:
        'Sportia aide les entraîneurs et clubs à savoir qui s\'est entraîné, quelles séances arrivent et comment évolue la participation de chaque équipe.',
      cta: 'Voir présence',
      ctaSecondary: 'Planifier séance',
    },
    card: { todayTraining: 'Entraînement du jour', quickList: 'Liste rapide' },
    status: { present: 'Présent', absent: 'Absent', late: 'En retard' },
    sport: { football: 'Football', basketball: 'Basket', volleyball: 'Volley', rugby: 'Rugby' },
    metrics: {
      activeAthletes: 'Sportifs actifs',
      weeklyAttendance: 'Présence hebdo.',
      registeredTeams: 'Équipes inscrites',
    },
    sessions: { eyebrow: 'Agenda', title: 'Prochaines séances' },
    sessionData: {
      techniqueAndMobility: 'Technique et mobilité',
      zoneDefense: 'Défense de zone',
      blockAndReception: 'Bloc et réception',
      sub16Football: 'U-16 football',
      womenBasketball: 'Basket féminin',
      mixedVolleyball: 'Volley mixte',
      today: 'Aujourd\'hui, 18h30',
      tomorrow: 'Demain, 10h00',
      friday: 'Vendredi, 19h00',
    },
    accent: {
      eyebrow: 'Prochaine étape',
      title: 'Premier module prêt à connecter des données réelles.',
      description:
        'Cette base prépare l\'expérience principale : enregistrer la présence, visualiser les indicateurs et trier les entraînements par sport ou équipe.',
      cta: 'Commencer le chargement',
    },
  },

  de: {
    nav: { attendance: 'Anwesenheit', teams: 'Teams', sessions: 'Einheiten' },
    hero: {
      eyebrow: 'Multi-Sport-Management',
      title: 'Anwesenheit, Teams und Training an einem Ort verwalten.',
      description:
        'Sportia hilft Trainern und Vereinen zu wissen, wer trainiert hat, welche Einheiten anstehen und wie sich die Teilnahme jedes Teams entwickelt.',
      cta: 'Anwesenheit ansehen',
      ctaSecondary: 'Einheit planen',
    },
    card: { todayTraining: 'Heutiges Training', quickList: 'Schnellliste' },
    status: { present: 'Anwesend', absent: 'Abwesend', late: 'Verspätet' },
    sport: { football: 'Fußball', basketball: 'Basketball', volleyball: 'Volleyball', rugby: 'Rugby' },
    metrics: {
      activeAthletes: 'Aktive Sportler',
      weeklyAttendance: 'Wöchentl. Anwesenh.',
      registeredTeams: 'Registrierte Teams',
    },
    sessions: { eyebrow: 'Kalender', title: 'Nächste Einheiten' },
    sessionData: {
      techniqueAndMobility: 'Technik & Mobilität',
      zoneDefense: 'Zonenverteidigung',
      blockAndReception: 'Block & Annahme',
      sub16Football: 'U-16 Fußball',
      womenBasketball: 'Damen-Basketball',
      mixedVolleyball: 'Mixed Volleyball',
      today: 'Heute, 18:30',
      tomorrow: 'Morgen, 10:00',
      friday: 'Freitag, 19:00',
    },
    accent: {
      eyebrow: 'Nächster Schritt',
      title: 'Erstes Modul bereit für echte Daten.',
      description:
        'Diese Grundlage bereitet das Kernerlebnis vor: Anwesenheit erfassen, Kennzahlen visualisieren und Trainingseinheiten nach Sportart oder Team ordnen.',
      cta: 'Laden starten',
    },
  },

  it: {
    nav: { attendance: 'Presenze', teams: 'Squadre', sessions: 'Sessioni' },
    hero: {
      eyebrow: 'Gestione sportiva multi-sport',
      title: 'Controlla presenze, squadre e allenamenti da un unico posto.',
      description:
        'Sportia aiuta allenatori e club a sapere chi si è allenato, quali sessioni arrivano e come evolve la partecipazione di ogni squadra.',
      cta: 'Vedi presenze',
      ctaSecondary: 'Pianifica sessione',
    },
    card: { todayTraining: 'Allenamento di oggi', quickList: 'Lista rapida' },
    status: { present: 'Presente', absent: 'Assente', late: 'In ritardo' },
    sport: { football: 'Calcio', basketball: 'Basket', volleyball: 'Pallavolo', rugby: 'Rugby' },
    metrics: {
      activeAthletes: 'Atleti attivi',
      weeklyAttendance: 'Presenze settimanali',
      registeredTeams: 'Squadre registrate',
    },
    sessions: { eyebrow: 'Agenda', title: 'Prossime sessioni' },
    sessionData: {
      techniqueAndMobility: 'Tecnica e mobilità',
      zoneDefense: 'Difesa a zona',
      blockAndReception: 'Muro e ricezione',
      sub16Football: 'U-16 calcio',
      womenBasketball: 'Basket femminile',
      mixedVolleyball: 'Pallavolo mista',
      today: 'Oggi, 18:30',
      tomorrow: 'Domani, 10:00',
      friday: 'Venerdì, 19:00',
    },
    accent: {
      eyebrow: 'Prossimo passo',
      title: 'Primo modulo pronto per collegare dati reali.',
      description:
        'Questa base prepara l\'esperienza principale: registrare presenze, visualizzare indicatori e ordinare allenamenti per sport o squadra.',
      cta: 'Inizia caricamento',
    },
  },

  zh: {
    nav: { attendance: '考勤', teams: '团队', sessions: '训练' },
    hero: {
      eyebrow: '多运动管理',
      title: '在一个地方管理考勤、团队和训练。',
      description:
        'Sportia 帮助教练和俱乐部了解谁参加了训练、接下来有哪些课程以及每支队伍的参与情况如何变化。',
      cta: '查看考勤',
      ctaSecondary: '规划训练',
    },
    card: { todayTraining: '今日训练', quickList: '快速列表' },
    status: { present: '出席', absent: '缺席', late: '迟到' },
    sport: { football: '足球', basketball: '篮球', volleyball: '排球', rugby: '橄榄球' },
    metrics: {
      activeAthletes: '活跃运动员',
      weeklyAttendance: '周出勤率',
      registeredTeams: '注册团队',
    },
    sessions: { eyebrow: '日程', title: '即将到来的训练' },
    sessionData: {
      techniqueAndMobility: '技术与灵活性',
      zoneDefense: '区域防守',
      blockAndReception: '拦网与接发球',
      sub16Football: 'U-16 足球',
      womenBasketball: '女子篮球',
      mixedVolleyball: '混合排球',
      today: '今天 18:30',
      tomorrow: '明天 10:00',
      friday: '周五 19:00',
    },
    accent: {
      eyebrow: '下一步',
      title: '第一个模块已准备好连接真实数据。',
      description:
        '此基础为核心体验做好了准备：记录出勤、查看指标、按运动项目或团队排序训练。',
      cta: '开始加载',
    },
  },

  ja: {
    nav: { attendance: '出席', teams: 'チーム', sessions: 'セッション' },
    hero: {
      eyebrow: 'マルチスポーツ管理',
      title: '出席・チーム・トレーニングを一か所で管理。',
      description:
        'Sportia はコーチやクラブが、誰がトレーニングしたか、次のセッションは何か、各チームの参加状況がどう変化しているかを把握するのを支援します。',
      cta: '出席を見る',
      ctaSecondary: 'セッションを計画',
    },
    card: { todayTraining: '今日のトレーニング', quickList: 'クイックリスト' },
    status: { present: '出席', absent: '欠席', late: '遅刻' },
    sport: { football: 'サッカー', basketball: 'バスケ', volleyball: 'バレー', rugby: 'ラグビー' },
    metrics: {
      activeAthletes: 'アクティブ選手',
      weeklyAttendance: '週間出席率',
      registeredTeams: '登録チーム',
    },
    sessions: { eyebrow: 'スケジュール', title: '今後のセッション' },
    sessionData: {
      techniqueAndMobility: 'テクニックとモビリティ',
      zoneDefense: 'ゾーンディフェンス',
      blockAndReception: 'ブロックとレセプション',
      sub16Football: 'U-16 サッカー',
      womenBasketball: '女子バスケ',
      mixedVolleyball: 'ミックスバレー',
      today: '今日 18:30',
      tomorrow: '明日 10:00',
      friday: '金曜 19:00',
    },
    accent: {
      eyebrow: '次のステップ',
      title: '最初のモジュールが実データ接続の準備完了。',
      description:
        'この基盤はコア体験を準備します：出席記録、指標の可視化、スポーツやチームごとのトレーニング整理。',
      cta: 'ロード開始',
    },
  },

  ko: {
    nav: { attendance: '출석', teams: '팀', sessions: '세션' },
    hero: {
      eyebrow: '멀티 스포츠 관리',
      title: '출석, 팀, 훈련을 한곳에서 관리하세요.',
      description:
        'Sportia는 코치와 클럽이 누가 훈련했는지, 다음 세션은 무엇인지, 각 팀의 참여도가 어떻게 변하고 있는지 파악하도록 돕습니다.',
      cta: '출석 보기',
      ctaSecondary: '세션 계획',
    },
    card: { todayTraining: '오늘의 훈련', quickList: '빠른 목록' },
    status: { present: '출석', absent: '결석', late: '지각' },
    sport: { football: '축구', basketball: '농구', volleyball: '배구', rugby: '럭비' },
    metrics: {
      activeAthletes: '활동 선수',
      weeklyAttendance: '주간 출석률',
      registeredTeams: '등록된 팀',
    },
    sessions: { eyebrow: '일정', title: '예정된 세션' },
    sessionData: {
      techniqueAndMobility: '기술 및 이동성',
      zoneDefense: '지역 수비',
      blockAndReception: '블로킹과 리시브',
      sub16Football: 'U-16 축구',
      womenBasketball: '여자 농구',
      mixedVolleyball: '혼성 배구',
      today: '오늘 18:30',
      tomorrow: '내일 10:00',
      friday: '금요일 19:00',
    },
    accent: {
      eyebrow: '다음 단계',
      title: '첫 번째 모듈이 실제 데이터 연결 준비 완료.',
      description:
        '이 기반은 핵심 경험을 준비합니다: 출석 기록, 지표 시각화, 스포츠 또는 팀별 훈련 정렬.',
      cta: '로딩 시작',
    },
  },

  ar: {
    nav: { attendance: 'الحضور', teams: 'الفرق', sessions: 'الجلسات' },
    hero: {
      eyebrow: 'إدارة رياضية متعددة',
      title: 'تابع الحضور والفرق والتدريبات من مكان واحد.',
      description:
        'يساعد Sportia المدربين والأندية على معرفة من تدرّب، وما الجلسات القادمة، وكيف تتطور مشاركة كل فريق.',
      cta: 'عرض الحضور',
      ctaSecondary: 'تخطيط جلسة',
    },
    card: { todayTraining: 'تدريب اليوم', quickList: 'قائمة سريعة' },
    status: { present: 'حاضر', absent: 'غائب', late: 'متأخر' },
    sport: { football: 'كرة قدم', basketball: 'كرة سلة', volleyball: 'كرة طائرة', rugby: 'رجبي' },
    metrics: {
      activeAthletes: 'رياضيون نشطون',
      weeklyAttendance: 'حضور أسبوعي',
      registeredTeams: 'فرق مسجلة',
    },
    sessions: { eyebrow: 'الجدول', title: 'الجلسات القادمة' },
    sessionData: {
      techniqueAndMobility: 'تقنية وحركة',
      zoneDefense: 'دفاع المنطقة',
      blockAndReception: 'صد واستقبال',
      sub16Football: 'أقل من 16 كرة قدم',
      womenBasketball: 'سلة نسائية',
      mixedVolleyball: 'طائرة مختلطة',
      today: 'اليوم، 18:30',
      tomorrow: 'غداً، 10:00',
      friday: 'الجمعة، 19:00',
    },
    accent: {
      eyebrow: 'الخطوة التالية',
      title: 'الوحدة الأولى جاهزة لربط بيانات حقيقية.',
      description:
        'تُجهّز هذه القاعدة التجربة الأساسية: تسجيل الحضور، عرض المؤشرات وترتيب التدريبات حسب الرياضة أو الفريق.',
      cta: 'بدء التحميل',
    },
  },
};

export default translations;
