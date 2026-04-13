import fs from 'fs';
import path from 'path';

const localesDir = path.join(process.cwd(), 'src/lib/locales');
const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.json'));

const seoContent = {
  tr: {
    home: {
      title: 'Liberteryen Anarşist Faaliyet',
      description: 'Anarşist, liberteryen eylem ve entelektüel bilgi paylaşım platformu. Özgürlük, bireysel haklar ve anarko-kapitalizm üzerine makaleler ve analizler.',
      keywords: 'anarşizm, liberteryen, özgürlük, bireysel haklar'
    },
    articles: {
      title: 'Makaleler',
      description: 'Liberter anarşizm, özgürlük ve bireysel haklar üzerine makalelerimizi keşfedin. Felsefe, iktisat, devlet teorisi ve daha fazlası.',
      keywords: 'makaleler, anarşizm, liberteryen, felsefe, iktisat'
    },
    article: {
      title: 'Makale',
      description: 'LAF platformunda yayınlanan makaleyi okuyun.',
      keywords: 'makale, anarşizm, liberteryen, özgürlük'
    },
    profile: {
      title: 'Profil',
      description: 'LAF kullanıcı profili ve makaleleri.',
      keywords: 'profil, kullanıcı, yazar'
    },
    events: {
      title: 'Faaliyetler ve Duyurular',
      description: 'LAF etkinlikleri, seminerleri ve duyuruları. Türkiye haritasından şehirleri seçerek yaklaşan ve geçmiş etkinlikleri görüntüleyin.',
      keywords: 'etkinlik, seminer, duyuru, anarşist etkinlikler, liberteryen buluşma'
    },
    help: {
      title: 'Yardım Merkezi',
      description: 'LAF platformu kullanımı hakkında sıkça sorulan sorular ve yardım dokümanları.',
      keywords: 'yardım, sıkça sorulan sorular, nasıl kullanılır, rehber'
    },
    login: {
      title: 'Giriş Yap',
      description: 'LAF hesabınıza giriş yapın. Bireysel hakları savunan liberteryen anarşist topluluğumuza katılın.',
      keywords: 'giriş, üye girişi, hesap erişimi'
    },
    register: {
      title: 'Kayıt Ol',
      description: "LAF'a üye olun ve liberteryen anarşist topluluğumuza katılın. Bireysel özgürlükleri savunan bağımsız platformumuzda yerinizi alın.",
      keywords: 'kayıt, üye ol, hesap oluştur'
    },
    forgot: {
      title: 'Şifremi Unuttum',
      description: 'LAF hesap şifrenizi sıfırlayın. Mnemonic kelimelerinizle güvenli şekilde şifre yenileyin.',
      keywords: 'şifre sıfırlama, hesap kurtarma'
    },
    links: {
      title: 'Bağlantılar',
      description: 'LAF sosyal medya hesapları ve iletişim bağlantıları. Telegram, Discord ve diğer platformlarda bizi takip edin.',
      keywords: 'sosyal medya, telegram, discord, iletişim'
    },
    write: {
      title: 'Makale Yaz',
      description: 'LAF platformunda makale yazın ve yayınlayın. Özgürlük, anarşizm ve liberteryenizm hakkında düşüncelerinizi paylaşın.',
      keywords: 'makale yaz, içerik oluştur, blog yaz'
    },
    qa: {
      title: 'Soru & Cevap',
      description: 'LAF Soru & Cevap platformunda anarşizm, liberteryenizm ve özgürlük hakkında sorular sorun, moderatörlerimizden cevap alın.',
      keywords: 'soru cevap, anarşizm soruları, liberteryenizm, özgürlük'
    },
    moderation: {
      title: 'Moderasyon Paneli',
      description: 'LAF platformu moderasyon yönetim paneli.',
      keywords: 'moderasyon, içerik yönetimi, admin'
    }
  },
  en: {
    home: {
      title: 'Libertarian Anarchist Foundation',
      description: 'Anarchist, libertarian action and intellectual knowledge sharing platform. Articles and analysis on freedom, individual rights, and anarcho-capitalism.',
      keywords: 'anarchism, libertarian, freedom, individual rights'
    },
    articles: {
      title: 'Articles',
      description: 'Explore our articles on libertarian anarchism, freedom, and individual rights. Philosophy, economics, state theory and more.',
      keywords: 'articles, anarchism, libertarian, philosophy, economics'
    },
    article: {
      title: 'Article',
      description: 'Read the article published on the LAF platform.',
      keywords: 'article, anarchism, libertarian, freedom'
    },
    profile: {
      title: 'Profile',
      description: 'LAF user profile and articles.',
      keywords: 'profile, user, author'
    },
    events: {
      title: 'Activities and Announcements',
      description: 'LAF events, seminars and announcements. View upcoming and past events by selecting cities from the map.',
      keywords: 'event, seminar, announcement, anarchist events, libertarian meetup'
    },
    help: {
      title: 'Help Center',
      description: 'Frequently asked questions and help documentation about using the LAF platform.',
      keywords: 'help, faq, how to use, guide'
    },
    login: {
      title: 'Log In',
      description: 'Log in to your LAF account. Join our libertarian anarchist community defending individual rights.',
      keywords: 'login, user login, account access'
    },
    register: {
      title: 'Register',
      description: 'Become a member of LAF and join our libertarian anarchist community. Take your place on our independent platform defending individual freedoms.',
      keywords: 'register, sign up, create account'
    },
    forgot: {
      title: 'Forgot Password',
      description: 'Reset your LAF account password. Securely renew your password with your mnemonic words.',
      keywords: 'password reset, account recovery'
    },
    links: {
      title: 'Links',
      description: 'LAF social media accounts and contact links. Follow us on Telegram, Discord, and other platforms.',
      keywords: 'social media, telegram, discord, contact'
    },
    write: {
      title: 'Write Article',
      description: 'Write and publish articles on the LAF platform. Share your thoughts on freedom, anarchism and libertarianism.',
      keywords: 'write article, create content, write blog'
    },
    qa: {
      title: 'Q&A',
      description: 'Ask questions about anarchism, libertarianism and freedom on the LAF Q&A platform, get answers from our moderators.',
      keywords: 'q&a, questions on anarchism, libertarianism, freedom'
    },
    moderation: {
      title: 'Moderation Panel',
      description: 'LAF platform moderation management panel.',
      keywords: 'moderation, content management, admin'
    }
  },
  es: {
    home: {
      title: 'Fundación Libertaria Anarquista',
      description: 'Plataforma de acción y difusión de conocimiento intelectual anarquista y libertario. Artículos y análisis sobre libertad, derechos individuales y anarcocapitalismo.',
      keywords: 'anarquismo, libertario, libertad, derechos individuales'
    },
    articles: {
      title: 'Artículos',
      description: 'Explora nuestros artículos sobre anarquismo libertario, libertad y derechos individuales. Filosofía, economía, teoría del estado y más.',
      keywords: 'artículos, anarquismo, libertario, filosofía, economía'
    },
    article: {
      title: 'Artículo',
      description: 'Lea el artículo publicado en la plataforma LAF.',
      keywords: 'artículo, anarquismo, libertario, libertad'
    },
    profile: {
      title: 'Perfil',
      description: 'Perfil de usuario y artículos de LAF.',
      keywords: 'perfil, usuario, autor'
    },
    events: {
      title: 'Múltiples Actividades y Anuncios',
      description: 'Eventos, seminarios y anuncios de LAF. Ver eventos pasados y futuros seleccionando ciudades en el mapa.',
      keywords: 'evento, seminario, anuncio, eventos anarquistas, encuentro libertario'
    },
    help: {
      title: 'Centro de Ayuda',
      description: 'Preguntas frecuentes y documentación de ayuda sobre el uso de la plataforma LAF.',
      keywords: 'ayuda, preguntas frecuentes, cómo usar, guía'
    },
    login: {
      title: 'Iniciar Sesión',
      description: 'Inicie sesión en su cuenta LAF. Únase a nuestra comunidad anarquista libertaria que defiende los derechos individuales.',
      keywords: 'iniciar sesión, acceso de usuario, cuenta'
    },
    register: {
      title: 'Registrarse',
      description: 'Conviértase en miembro de LAF y únase a nuestra comunidad anarquista libertaria. Ocupe su lugar en nuestra plataforma independiente.',
      keywords: 'registrar, inscribirse, crear cuenta'
    },
    forgot: {
      title: 'Olvidé Mi Contraseña',
      description: 'Restablecer su contraseña de cuenta LAF. Renueve su contraseña de manera segura con sus palabras mnemotécnicas.',
      keywords: 'restablecimiento de contraseña, recuperación de cuenta'
    },
    links: {
      title: 'Enlaces',
      description: 'Cuentas de redes sociales y enlaces de contacto de LAF. Síguenos en Telegram, Discord y otras plataformas.',
      keywords: 'redes sociales, telegram, discord, contacto'
    },
    write: {
      title: 'Escribir Artículo',
      description: 'Escriba y publique artículos en la plataforma LAF. Comparta sus pensamientos sobre la libertad, el anarquismo y el libertarismo.',
      keywords: 'escribir artículo, crear contenido, blog'
    },
    qa: {
      title: 'Preguntas y Respuestas',
      description: 'Haga preguntas sobre el anarquismo, el libertarismo y la libertad en la plataforma de preguntas y respuestas de LAF.',
      keywords: 'q&a, preguntas de anarquismo, libertarismo, libertad'
    },
    moderation: {
      title: 'Panel de Moderación',
      description: 'Panel de gestión de moderación de la plataforma LAF.',
      keywords: 'moderación, gestión de contenido, administrador'
    }
  }
};

for (const file of files) {
  const lang = file.replace('.json', '');
  const filePath = path.join(localesDir, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  const langContent = seoContent[lang] || seoContent['en'];
  
  data.seo = langContent;
  
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

console.log("Updated translation files with SEO content.");
