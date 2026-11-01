// ============================================================================
// The patient emails: the same letter Practice Hub sends (Holy Name navy and
// teal, one clear button, nothing clinical), in the twelve languages the form
// offers. Ported from Practice Hub's src/lib/intake-email.ts on 2026-11-01.
//
// Occasions:
//   "express"  the welcome after the Book a consult form: the office will call
//              within 24 to 48 hours; here is the questionnaire to do meanwhile
//   "resume"   the finish-later link a patient asked for inside the form
//   "visit" / "referral"  kept as in Practice Hub (an invite from a chart)
// `siteLink` means the button opens another intake site's front page rather
// than a private resume link, so nothing about expiry is said.
// ============================================================================
import EXTRA from "./intake-email-extra.js";

const SURGEON = { name: "Aaron Wey, MD, FAAOS, FACS", title: "Adult and Pediatric Spine Surgeon", institution: "Holy Name Medical Center" };
const RTL = /* @__PURE__ */ new Set(["ar", "he"]);
const WORDS = {
  en: {
    subject: "Your pre-visit questionnaire — Dr. Aaron Wey's office",
    hello: (first, minor) => `Hello${minor || !first ? "" : ` ${first}`},`,
    intro: (who) => `Thank you for choosing our practice. To make the most of ${who} upcoming visit with Dr. Wey, please complete the pre-visit questionnaire using the secure link below. It takes about 15–20 minutes, saves automatically as you go, and can be finished on a phone, tablet or computer.`,
    about: (expires, minor, first) => `${minor ? "A parent or guardian should complete it together with the child. " : ""}This private link is just for you and works until ${expires}. Having ${minor ? "the" : "your"} history, medications and any imaging ahead of time lets us spend our time together on what matters most — ${minor ? first || "your child" : "you"}.`,
    help: (phone) => `If you have any questions or any trouble with the form, please call us${phone ? ` at ${phone}` : ""} and we will gladly help.`,
    button: "Open my Pre-Visit Questionnaire",
    regards: "Warm regards,",
    team: "and your care team",
    eyebrow: "Pre-visit questionnaire",
    footer: (expires, url) => `This link is private to you and expires on ${expires}. If the button does not open, copy this address into your browser: ${url}`,
    noReply: (phone) => `This email was sent automatically; please do not reply to it. For any question, call our office${phone ? ` at ${phone}` : ""}.`,
    welcome: {
      subject: "Welcome from Dr. Aaron Wey's office — your pre-visit questionnaire",
      intro: (first, minor, by) => `Welcome to our practice. ${by ? `${by} has referred ${minor ? `your child${first ? `, ${first},` : ""}` : "you"}` : `${minor ? `Your child${first ? `, ${first},` : ""} has` : "You have"} been referred`} to Dr. Aaron Wey, and we look forward to meeting you. Before we call to arrange ${minor ? "the" : "your"} consultation, please complete the pre-visit questionnaire using the secure link below. It takes about 15–20 minutes, saves automatically as you go, and can be finished on a phone, tablet or computer.`,
      about: (expires, minor) => `${minor ? "A parent or guardian should complete it together with the child. " : ""}This private link is just for you and works until ${expires}. Your answers let our team review the history, medications and any imaging ahead of time, so we can prepare properly for the consultation and spend our time together on what matters most.`,
      next: (phone) => `Once your questionnaire is in, our office will contact you to schedule the consultation. If you have not heard from us within a few business days, or have any questions, please call us${phone ? ` at ${phone}` : ""}.`,
      button: "Complete my Pre-Visit Questionnaire"
    }
  },
  es: {
    subject: "Su cuestionario previo a la visita — Consultorio del Dr. Aaron Wey",
    hello: (first, minor) => `Hola${minor || !first ? "" : ` ${first}`}:`,
    intro: (who) => `Gracias por elegir nuestro consultorio. Para aprovechar al m\xE1ximo ${who === "your" ? "su" : "la"} pr\xF3xima visita con el Dr. Wey, complete el cuestionario previo a la visita usando el enlace seguro que aparece abajo. Toma entre 15 y 20 minutos, se guarda autom\xE1ticamente y puede completarse desde un tel\xE9fono, una tableta o una computadora.`,
    about: (expires, minor) => `${minor ? "Un padre, madre o tutor debe completarlo junto con el ni\xF1o o la ni\xF1a. " : ""}Este enlace privado es solo para usted y funciona hasta el ${expires}. Contar con antelaci\xF3n con los antecedentes, los medicamentos y cualquier estudio de imagen nos permite dedicar la visita a lo que m\xE1s importa.`,
    help: (phone) => `Si tiene preguntas o alguna dificultad con el formulario, ll\xE1menos${phone ? ` al ${phone}` : ""} y con gusto le ayudaremos.`,
    button: "Abrir mi cuestionario previo a la visita",
    regards: "Un cordial saludo,",
    team: "y su equipo de atenci\xF3n",
    eyebrow: "Cuestionario previo a la visita",
    footer: (expires, url) => `Este enlace es privado y vence el ${expires}. Si el bot\xF3n no se abre, copie esta direcci\xF3n en su navegador: ${url}`,
    noReply: (phone) => `Este correo se envi\xF3 autom\xE1ticamente; por favor no responda a este mensaje. Para cualquier pregunta, llame a nuestro consultorio${phone ? ` al ${phone}` : ""}.`,
    welcome: {
      subject: "Bienvenida del consultorio del Dr. Aaron Wey — su cuestionario previo a la visita",
      intro: (first, minor, by) => `Bienvenido a nuestro consultorio. ${by ? `${by} ${minor ? `ha remitido a su hijo o hija${first ? `, ${first},` : ""}` : "le ha remitido"}` : `${minor ? `Su hijo o hija${first ? `, ${first},` : ""} ha sido remitido` : "Usted ha sido remitido"}`} al Dr. Aaron Wey, y esperamos conocerle pronto. Antes de llamarle para programar la consulta, complete el cuestionario previo a la visita usando el enlace seguro que aparece abajo. Toma entre 15 y 20 minutos, se guarda autom\xE1ticamente y puede completarse desde un tel\xE9fono, una tableta o una computadora.`,
      about: (expires, minor) => `${minor ? "Un padre, madre o tutor debe completarlo junto con el ni\xF1o o la ni\xF1a. " : ""}Este enlace privado es solo para usted y funciona hasta el ${expires}. Sus respuestas permiten a nuestro equipo revisar con antelaci\xF3n los antecedentes, los medicamentos y cualquier estudio de imagen, para prepararnos bien para la consulta y dedicar el tiempo juntos a lo que m\xE1s importa.`,
      next: (phone) => `Cuando recibamos su cuestionario, nuestro consultorio se comunicar\xE1 con usted para programar la consulta. Si no tiene noticias nuestras en unos d\xEDas h\xE1biles, o tiene alguna pregunta, ll\xE1menos${phone ? ` al ${phone}` : ""}.`,
      button: "Completar mi cuestionario previo a la visita"
    }
  },
  pt: {
    subject: "Seu question\xE1rio pr\xE9-consulta — Consult\xF3rio do Dr. Aaron Wey",
    hello: (first, minor) => `Ol\xE1${minor || !first ? "" : `, ${first}`},`,
    intro: () => `Obrigado por escolher o nosso consult\xF3rio. Para aproveitar ao m\xE1ximo a pr\xF3xima consulta com o Dr. Wey, preencha o question\xE1rio pr\xE9-consulta pelo link seguro abaixo. Leva cerca de 15 a 20 minutos, \xE9 salvo automaticamente e pode ser conclu\xEDdo no celular, tablet ou computador.`,
    about: (expires, minor) => `${minor ? "Um dos pais ou o respons\xE1vel deve preench\xEA-lo junto com a crian\xE7a. " : ""}Este link \xE9 privado, s\xF3 para voc\xEA, e funciona at\xE9 ${expires}. Ter o hist\xF3rico, os medicamentos e os exames de imagem com anteced\xEAncia permite que a consulta se concentre no que mais importa.`,
    help: (phone) => `Se tiver d\xFAvidas ou dificuldade com o formul\xE1rio, ligue para n\xF3s${phone ? ` no ${phone}` : ""} e teremos prazer em ajudar.`,
    button: "Abrir meu question\xE1rio pr\xE9-consulta",
    regards: "Atenciosamente,",
    team: "e sua equipe de atendimento",
    eyebrow: "Question\xE1rio pr\xE9-consulta",
    footer: (expires, url) => `Este link \xE9 privado e expira em ${expires}. Se o bot\xE3o n\xE3o abrir, copie este endere\xE7o no seu navegador: ${url}`,
    noReply: (phone) => `Este e-mail foi enviado automaticamente; por favor, n\xE3o responda a esta mensagem. Em caso de d\xFAvida, ligue para o nosso consult\xF3rio${phone ? ` no ${phone}` : ""}.`,
    welcome: {
      subject: "Boas-vindas do consult\xF3rio do Dr. Aaron Wey — seu question\xE1rio pr\xE9-consulta",
      intro: (first, minor, by) => `Bem-vindo ao nosso consult\xF3rio. ${by ? `${by} encaminhou ${minor ? `seu filho ou filha${first ? `, ${first},` : ""}` : "voc\xEA"}` : `${minor ? `Seu filho ou filha${first ? `, ${first},` : ""} foi encaminhado` : "Voc\xEA foi encaminhado"}`} ao Dr. Aaron Wey, e esperamos conhec\xEA-lo em breve. Antes de ligarmos para marcar a consulta, preencha o question\xE1rio pr\xE9-consulta pelo link seguro abaixo. Leva cerca de 15 a 20 minutos, \xE9 salvo automaticamente e pode ser conclu\xEDdo no celular, tablet ou computador.`,
      about: (expires, minor) => `${minor ? "Um dos pais ou o respons\xE1vel deve preench\xEA-lo junto com a crian\xE7a. " : ""}Este link \xE9 privado, s\xF3 para voc\xEA, e funciona at\xE9 ${expires}. Suas respostas permitem que nossa equipe analise com anteced\xEAncia o hist\xF3rico, os medicamentos e os exames de imagem, para nos prepararmos bem para a consulta e dedicar o tempo juntos ao que mais importa.`,
      next: (phone) => `Assim que recebermos o question\xE1rio, nosso consult\xF3rio entrar\xE1 em contato para agendar a consulta. Se n\xE3o tiver not\xEDcias nossas em alguns dias \xFAteis, ou tiver d\xFAvidas, ligue para n\xF3s${phone ? ` no ${phone}` : ""}.`,
      button: "Preencher meu question\xE1rio pr\xE9-consulta"
    }
  },
  zh: {
    subject: "您的就诊前问卷 — 魏医生诊所",
    hello: (first, minor) => `${minor || !first ? "您好" : `${first}，您好`}：`,
    intro: () => `感谢您选择我们的诊所。为了充分利用即将与 魏医生进行的就诊，请通过下方的安全链接填写就诊前问卷。大约需要 15 到 20 分钟，填写过程中会自动保存，可在手机、平板或电脑上完成。`,
    about: (expires, minor) => `${minor ? "请家长或监护人与孩子一起填写。" : ""}此链接仅供您本人使用，有效期至 ${expires}。提前了解病史、用药和影像检查，能让我们把就诊时间用在最重要的事情上。`,
    help: (phone) => `如有任何疑问或填写困难，请致电我们${phone ? `：${phone}` : ""}，我们很乐意帮助您。`,
    button: "打开我的就诊前问卷",
    regards: "此致",
    team: "及您的医疗团队",
    eyebrow: "就诊前问卷",
    footer: (expires, url) => `此链接仅供您本人使用，将于 ${expires} 失效。如按钮无法打开，请将此地址复制到浏览器：${url}`,
    noReply: (phone) => `此邮件为系统自动发送，请勿直接回复。如有任何问题，请致电我们的诊所${phone ? `：${phone}` : ""}。`,
    welcome: {
      subject: "欢迎 — 魏医生诊所的就诊前问卷",
      intro: (first, minor, by) => `欢迎来到我们的诊所。${by ? `${by} 已将${minor ? `您的孩子${first ? ` ${first} ` : ""}` : "您"}转诊` : `${minor ? `您的孩子${first ? ` ${first} ` : ""}已被转诊` : "您已被转诊"}`}至 魏医生，我们期待与您见面。在我们致电安排就诊之前，请通过下方的安全链接填写就诊前问卷。大约需要 15 到 20 分钟，填写过程中会自动保存，可在手机、平板或电脑上完成。`,
      about: (expires, minor) => `${minor ? "请家长或监护人与孩子一起填写。" : ""}此链接仅供您本人使用，有效期至 ${expires}。您的回答能让我们的团队提前了解病史、用药和影像检查，为就诊做好充分准备，并把见面的时间用在最重要的事情上。`,
      next: (phone) => `收到您的问卷后，我们的诊所会与您联系安排就诊。如果几个工作日内未收到我们的消息，或有任何疑问，请致电我们${phone ? `：${phone}` : ""}。`,
      button: "填写我的就诊前问卷"
    }
  },
  ko: {
    subject: "방문 전 설문지 — Aaron Wey 박사 진료실",
    hello: (first, minor) => `${minor || !first ? "안녕하세요" : `${first}님, 안녕하세요`}.`,
    intro: () => `저희 진료실을 선택해 주셔서 감사합니다. Wey 박사와의 진료를 최대한 알차게 진행할 수 있도록 아래 보안 링크를 통해 방문 전 설문지를 작성해 주세요. 약 15~20분이 소요되며 작성 중 자동 저장되고, 휴대폰\xB7태블릿\xB7컴퓨터 어디서든 완료할 수 있습니다.`,
    about: (expires, minor) => `${minor ? "부모님 또는 보호자가 자녀와 함께 작성해 주세요. " : ""}이 링크는 귀하 전용이며 ${expires}까지 유효합니다. 병력, 복용 약, 영상 검사 정보를 미리 알면 진료 시간을 가장 중요한 일에 쓸 수 있습니다.`,
    help: (phone) => `질문이 있거나 작성에 어려움이 있으면${phone ? ` ${phone}으로` : ""} 전화 주세요. 기꺼이 도와드리겠습니다.`,
    button: "방문 전 설문지 열기",
    regards: "감사합니다.",
    team: "및 진료팀 드림",
    eyebrow: "방문 전 설문지",
    footer: (expires, url) => `이 링크는 귀하 전용이며 ${expires}에 만료됩니다. 버튼이 열리지 않으면 이 주소를 브라우저에 붙여 넣으세요: ${url}`,
    noReply: (phone) => `이 이메일은 자동으로 발송되었습니다. 회신하지 마시고, 문의 사항은 진료실로 전화해 주세요${phone ? ` (${phone})` : ""}.`,
    welcome: {
      subject: "환영합니다 — Aaron Wey 박사 진료실의 방문 전 설문지",
      intro: (first, minor, by) => `저희 진료실에 오신 것을 환영합니다. ${by ? `${by}께서 ${minor ? `자녀분${first ? `(${first})` : ""}을` : "귀하를"} Wey 박사에게 의뢰하셨습니다` : `${minor ? `자녀분${first ? `(${first})` : ""}이` : "귀하가"} Wey 박사에게 의뢰되었습니다`}. 만나 뵙기를 기대합니다. 진료 일정을 잡기 위해 전화드리기 전에, 아래 보안 링크를 통해 방문 전 설문지를 작성해 주세요. 약 15~20분이 소요되며 작성 중 자동 저장되고, 휴대폰\xB7태블릿\xB7컴퓨터 어디서든 완료할 수 있습니다.`,
      about: (expires, minor) => `${minor ? "부모님 또는 보호자가 자녀와 함께 작성해 주세요. " : ""}이 링크는 귀하 전용이며 ${expires}까지 유효합니다. 답변을 통해 저희 팀이 병력, 복용 약, 영상 검사 정보를 미리 검토하여 진료를 충실히 준비하고, 진료 시간을 가장 중요한 일에 쓸 수 있습니다.`,
      next: (phone) => `설문지가 접수되면 저희 진료실에서 진료 일정을 잡기 위해 연락드리겠습니다. 영업일 기준 며칠 내에 연락이 없거나 문의 사항이 있으면${phone ? ` ${phone}으로` : ""} 전화해 주세요.`,
      button: "방문 전 설문지 작성하기"
    }
  },
  ru: {
    subject: "Анкета перед визитом — кабинет доктора Аарона Вея",
    hello: (first, minor) => `Здравствуйте${minor || !first ? "" : `, ${first}`}!`,
    intro: () => `Благодарим вас за выбор нашей практики. Чтобы предстоящий визит к доктору Вею прошёл с наибольшей пользой, пожалуйста, заполните анкету перед визитом по защищённой ссылке ниже. Это займёт около 15–20 минут, ответы сохраняются автоматически, заполнить можно с телефона, планшета или компьютера.`,
    about: (expires, minor) => `${minor ? "Родитель или опекун должен заполнить её вместе с ребёнком. " : ""}Эта личная ссылка предназначена только для вас и действует до ${expires}. Зная заранее историю болезни, принимаемые лекарства и результаты обследований, мы сможем посвятить время визита самому важному.`,
    help: (phone) => `Если у вас есть вопросы или возникли трудности с анкетой, позвоните нам${phone ? ` по телефону ${phone}` : ""}, и мы с радостью поможем.`,
    button: "Открыть мою анкету перед визитом",
    regards: "С уважением,",
    team: "и ваша команда по уходу",
    eyebrow: "Анкета перед визитом",
    footer: (expires, url) => `Эта ссылка личная и действует до ${expires}. Если кнопка не открывается, скопируйте этот адрес в браузер: ${url}`,
    noReply: (phone) => `Это письмо отправлено автоматически, отвечать на него не нужно. По всем вопросам звоните в наш офис${phone ? `: ${phone}` : ""}.`,
    welcome: {
      subject: "Добро пожаловать — анкета перед визитом, кабинет доктора Аарона Вея",
      intro: (first, minor, by) => `Добро пожаловать в нашу практику. ${by ? `${by} направил(а) ${minor ? `вашего ребёнка${first ? ` (${first})` : ""}` : "вас"}` : `${minor ? `Ваш ребёнок${first ? ` (${first})` : ""} направлен` : "Вы направлены"}`} к доктору Аарону Вею, и мы будем рады встрече. Прежде чем мы позвоним, чтобы назначить консультацию, пожалуйста, заполните анкету перед визитом по защищённой ссылке ниже. Это займёт около 15–20 минут, ответы сохраняются автоматически, заполнить можно с телефона, планшета или компьютера.`,
      about: (expires, minor) => `${minor ? "Родитель или опекун должен заполнить её вместе с ребёнком. " : ""}Эта личная ссылка предназначена только для вас и действует до ${expires}. Ваши ответы позволят нашей команде заранее изучить историю болезни, лекарства и результаты обследований, как следует подготовиться к консультации и посвятить время встречи самому важному.`,
      next: (phone) => `Как только мы получим анкету, наш офис свяжется с вами, чтобы назначить консультацию. Если в течение нескольких рабочих дней мы не свяжемся с вами или у вас есть вопросы, позвоните нам${phone ? ` по телефону ${phone}` : ""}.`,
      button: "Заполнить анкету перед визитом"
    }
  },
  pl: {
    subject: "Ankieta przed wizytą — gabinet dr. Aarona Weya",
    hello: (first, minor) => `Dzień dobry${minor || !first ? "" : `, ${first}`},`,
    intro: () => `Dziękujemy za wyb\xF3r naszej praktyki. Aby jak najlepiej wykorzystać zbliżającą się wizytę u dr. Weya, prosimy o wypełnienie ankiety przed wizytą za pomocą bezpiecznego linku poniżej. Zajmuje to około 15–20 minut, odpowiedzi zapisują się automatycznie, a ankietę można wypełnić na telefonie, tablecie lub komputerze.`,
    about: (expires, minor) => `${minor ? "Rodzic lub opiekun powinien wypełnić ją razem z dzieckiem. " : ""}Ten prywatny link jest przeznaczony tylko dla Państwa i działa do ${expires}. Znając wcześniej historię choroby, przyjmowane leki i wyniki badań obrazowych, możemy poświęcić czas wizyty temu, co najważniejsze.`,
    help: (phone) => `W razie pytań lub trudności z formularzem prosimy o telefon${phone ? ` pod numer ${phone}` : ""} — chętnie pomożemy.`,
    button: "Otw\xF3rz moją ankietę przed wizytą",
    regards: "Z poważaniem,",
    team: "oraz zesp\xF3ł opiekujący się Państwem",
    eyebrow: "Ankieta przed wizytą",
    footer: (expires, url) => `Ten link jest prywatny i wygasa ${expires}. Jeśli przycisk nie działa, skopiuj ten adres do przeglądarki: ${url}`,
    noReply: (phone) => `Ta wiadomość została wysłana automatycznie — prosimy na nią nie odpowiadać. W razie pytań prosimy o kontakt telefoniczny z naszym biurem${phone ? `: ${phone}` : ""}.`,
    welcome: {
      subject: "Witamy — ankieta przed wizytą, gabinet dr. Aarona Weya",
      intro: (first, minor, by) => `Witamy w naszej praktyce. ${by ? `${by} skierował(a) ${minor ? `Państwa dziecko${first ? ` (${first})` : ""}` : "Państwa"}` : `${minor ? `Państwa dziecko${first ? ` (${first})` : ""} zostało skierowane` : "Zostali Państwo skierowani"}`} do dr. Aarona Weya i cieszymy się na spotkanie. Zanim zadzwonimy, aby um\xF3wić konsultację, prosimy o wypełnienie ankiety przed wizytą za pomocą bezpiecznego linku poniżej. Zajmuje to około 15–20 minut, odpowiedzi zapisują się automatycznie, a ankietę można wypełnić na telefonie, tablecie lub komputerze.`,
      about: (expires, minor) => `${minor ? "Rodzic lub opiekun powinien wypełnić ją razem z dzieckiem. " : ""}Ten prywatny link jest przeznaczony tylko dla Państwa i działa do ${expires}. Odpowiedzi pozwalają naszemu zespołowi wcześniej zapoznać się z historią choroby, lekami i badaniami obrazowymi, dobrze przygotować się do konsultacji i poświęcić czas wizyty temu, co najważniejsze.`,
      next: (phone) => `Po otrzymaniu ankiety nasze biuro skontaktuje się z Państwem, aby um\xF3wić konsultację. Jeśli w ciągu kilku dni roboczych nie odezwiemy się lub mają Państwo pytania, prosimy o telefon${phone ? ` pod numer ${phone}` : ""}.`,
      button: "Wypełnij ankietę przed wizytą"
    }
  },
  ar: {
    subject: "استبيان ما قبل الزيارة — عيادة الدكتور آرون واي",
    hello: (first, minor) => `مرحباً${minor || !first ? "" : ` ${first}`}،`,
    intro: () => `شكراً لاختياركم عيادتنا. للاستفادة القصوى من زيارتكم القادمة للدكتور واي، يرجى تعبئة استبيان ما قبل الزيارة عبر الرابط الآمن أدناه. يستغرق ذلك نحو 15 إلى 20 دقيقة، ويُحفظ تلقائياً أثناء التعبئة، ويمكن إكماله من الهاتف أو الجهاز اللوحي أو الحاسوب.`,
    about: (expires, minor) => `${minor ? "يُرجى أن يقوم أحد الوالدين أو ولي الأمر بتعبئته مع الطفل. " : ""}هذا الرابط خاص بكم وحدكم ويعمل حتى ${expires}. معرفة التاريخ المرضي والأدوية وصور الأشعة مسبقاً تتيح لنا تخصيص وقت الزيارة لما هو أهم.`,
    help: (phone) => `إذا كانت لديكم أي أسئلة أو واجهتم صعوبة في النموذج، يرجى الاتصال بنا${phone ? ` على الرقم ${phone}` : ""} وسنسعد بمساعدتكم.`,
    button: "فتح استبيان ما قبل الزيارة",
    regards: "مع أطيب التحيات،",
    team: "وفريق الرعاية الخاص بكم",
    eyebrow: "استبيان ما قبل الزيارة",
    footer: (expires, url) => `هذا الرابط خاص بكم وينتهي في ${expires}. إذا لم يعمل الزر، انسخوا هذا العنوان في المتصفح: ${url}`,
    noReply: (phone) => `أُرسلت هذه الرسالة تلقائياً، يرجى عدم الرد عليها. لأي استفسار يرجى الاتصال بمكتبنا${phone ? `: ${phone}` : ""}.`,
    welcome: {
      subject: "أهلاً بكم — استبيان ما قبل الزيارة من عيادة الدكتور آرون واي",
      intro: (first, minor, by) => `أهلاً بكم في عيادتنا. ${by ? `قام ${by} بتحويل ${minor ? `طفلكم${first ? ` ${first}` : ""}` : "حالتكم"}` : `${minor ? `تم تحويل طفلكم${first ? ` ${first}` : ""}` : "تم تحويلكم"}`} إلى الدكتور آرون واي، ونتطلع إلى لقائكم. قبل أن نتصل بكم لتحديد موعد الاستشارة، يرجى تعبئة استبيان ما قبل الزيارة عبر الرابط الآمن أدناه. يستغرق ذلك نحو 15 إلى 20 دقيقة، ويُحفظ تلقائياً أثناء التعبئة، ويمكن إكماله من الهاتف أو الجهاز اللوحي أو الحاسوب.`,
      about: (expires, minor) => `${minor ? "يُرجى أن يقوم أحد الوالدين أو ولي الأمر بتعبئته مع الطفل. " : ""}هذا الرابط خاص بكم وحدكم ويعمل حتى ${expires}. تتيح إجاباتكم لفريقنا مراجعة التاريخ المرضي والأدوية وصور الأشعة مسبقاً، لنستعد جيداً للاستشارة ونخصص وقت اللقاء لما هو أهم.`,
      next: (phone) => `بعد استلام الاستبيان سيتواصل معكم مكتبنا لتحديد موعد الاستشارة. إذا لم نتواصل معكم خلال بضعة أيام عمل، أو كانت لديكم أي أسئلة، يرجى الاتصال بنا${phone ? ` على الرقم ${phone}` : ""}.`,
      button: "تعبئة استبيان ما قبل الزيارة"
    }
  },
  he: {
    subject: 'שאלון לפני הביקור — מרפאת ד"ר אהרן ויי',
    hello: (first, minor) => `שלום${minor || !first ? "" : ` ${first}`},`,
    intro: () => `תודה שבחרתם במרפאה שלנו. כדי להפיק את המרב מהביקור הקרוב אצל ד"ר ויי, אנא מלאו את השאלון לפני הביקור באמצעות הקישור המאובטח שלמטה. המילוי אורך כ-15 עד 20 דקות, נשמר אוטומטית, וניתן להשלימו בטלפון, בטאבלט או במחשב.`,
    about: (expires, minor) => `${minor ? "הורה או אפוטרופוס צריך למלא אותו יחד עם הילד. " : ""}קישור פרטי זה מיועד לכם בלבד ותקף עד ${expires}. היכרות מראש עם ההיסטוריה הרפואית, התרופות והדימות מאפשרת לנו להקדיש את זמן הביקור למה שחשוב באמת.`,
    help: (phone) => `אם יש לכם שאלות או קושי במילוי הטופס, התקשרו אלינו${phone ? ` למספר ${phone}` : ""} ונשמח לעזור.`,
    button: "פתיחת השאלון לפני הביקור",
    regards: "בברכה,",
    team: "וצוות הטיפול שלכם",
    eyebrow: "שאלון לפני הביקור",
    footer: (expires, url) => `קישור זה פרטי ופג תוקפו ב-${expires}. אם הכפתור אינו נפתח, העתיקו כתובת זו לדפדפן: ${url}`,
    noReply: (phone) => `הודעה זו נשלחה אוטומטית, נא לא להשיב עליה. לכל שאלה התקשרו למשרדנו${phone ? `: ${phone}` : ""}.`,
    welcome: {
      subject: 'ברוכים הבאים — שאלון לפני הביקור ממרפאת ד"ר אהרן ויי',
      intro: (first, minor, by) => `ברוכים הבאים למרפאה שלנו. ${by ? `${by} הפנה ${minor ? `את ילדכם${first ? `, ${first},` : ""}` : "אתכם"}` : `${minor ? `ילדכם${first ? `, ${first},` : ""} הופנה` : "הופניתם"}`} אל ד"ר אהרן ויי, ואנו מצפים לפגוש אתכם. לפני שנתקשר לתאם את הייעוץ, אנא מלאו את השאלון לפני הביקור באמצעות הקישור המאובטח שלמטה. המילוי אורך כ-15 עד 20 דקות, נשמר אוטומטית, וניתן להשלימו בטלפון, בטאבלט או במחשב.`,
      about: (expires, minor) => `${minor ? "הורה או אפוטרופוס צריך למלא אותו יחד עם הילד. " : ""}קישור פרטי זה מיועד לכם בלבד ותקף עד ${expires}. תשובותיכם מאפשרות לצוות שלנו לעבור מראש על ההיסטוריה הרפואית, התרופות והדימות, להתכונן כראוי לייעוץ ולהקדיש את זמן הפגישה למה שחשוב באמת.`,
      next: (phone) => `לאחר קבלת השאלון, המשרד שלנו ייצור עמכם קשר לקביעת מועד הייעוץ. אם לא שמעתם מאיתנו בתוך כמה ימי עסקים, או שיש לכם שאלות, התקשרו אלינו${phone ? ` למספר ${phone}` : ""}.`,
      button: "מילוי השאלון לפני הביקור"
    }
  },
  ja: {
    subject: "受診前アンケートのご案内 — Aaron Wey医師の診療所",
    hello: (first, minor) => minor || !first ? "患者様" : `${first} 様`,
    intro: () => `当診療所をお選びいただきありがとうございます。Wey医師との次回の受診をより有意義なものにするため、下記の安全なリンクから受診前アンケートにご記入ください。所要時間は15〜20分程度で、入力内容は自動保存され、スマートフォン・タブレット・パソコンのいずれからでもご記入いただけます。`,
    about: (expires, minor) => `${minor ? "保護者の方がお子様と一緒にご記入ください。" : ""}このリンクは患者様専用で、${expires}まで有効です。病歴・服用中のお薬・画像検査の情報を事前に把握できれば、受診の時間を最も大切なことに使うことができます。`,
    help: (phone) => `ご不明な点やご記入でお困りの際は${phone ? `、${phone}まで` : "、当診療所まで"}お電話ください。喜んでお手伝いいたします。`,
    button: "受診前アンケートを開く",
    regards: "どうぞよろしくお願いいたします。",
    team: "および診療チーム",
    eyebrow: "受診前アンケート",
    footer: (expires, url) => `このリンクは患者様専用で、${expires}に期限が切れます。ボタンが開かない場合は、次のアドレスをブラウザにコピーしてください：${url}`,
    noReply: (phone) => `このメールは自動送信です。ご返信いただいてもお答えできません。お問い合わせは当診療所までお電話ください${phone ? `（${phone}）` : ""}。`,
    welcome: {
      subject: "ようこそ — Aaron Wey医師の診療所からの受診前アンケート",
      intro: (first, minor, by) => `当診療所へようこそ。${by ? `${by}より${minor ? `お子様${first ? `（${first}様）` : ""}` : "患者様"}をWey医師へご紹介いただきました` : `${minor ? `お子様${first ? `（${first}様）` : ""}が` : "患者様が"}Wey医師へご紹介されました`}。お会いできるのを楽しみにしております。ご相談の日程についてお電話を差し上げる前に、下記の安全なリンクから受診前アンケートにご記入ください。所要時間は15〜20分程度で、入力内容は自動保存され、スマートフォン・タブレット・パソコンのいずれからでもご記入いただけます。`,
      about: (expires, minor) => `${minor ? "保護者の方がお子様と一緒にご記入ください。" : ""}このリンクは患者様専用で、${expires}まで有効です。ご回答をもとに、病歴・服用中のお薬・画像検査の情報を事前に確認し、ご相談にしっかり備え、お会いする時間を最も大切なことに使うことができます。`,
      next: (phone) => `アンケートを受け取り次第、当診療所よりご相談の日程についてご連絡いたします。数営業日たっても連絡がない場合やご不明な点がある場合は${phone ? `、${phone}まで` : "、当診療所まで"}お電話ください。`,
      button: "受診前アンケートに記入する"
    }
  },
  hi: {
    subject: "आपकी मुलाक़ात-पूर्व प्रश्नावली — डॉ. ऐरन वे का कार्यालय",
    hello: (first, minor) => `नमस्ते${minor || !first ? "" : ` ${first} जी`},`,
    intro: () => `हमारे क्लिनिक को चुनने के लिए धन्यवाद। डॉ. वे के साथ आपकी आगामी मुलाक़ात का पूरा लाभ उठाने के लिए, कृपया नीचे दिए गए सुरक्षित लिंक से मुलाक़ात-पूर्व प्रश्नावली भरें। इसमें लगभग 15–20 मिनट लगते हैं, उत्तर अपने-आप सहेजे जाते हैं, और इसे फ़ोन, टैबलेट या कंप्यूटर पर पूरा किया जा सकता है।`,
    about: (expires, minor) => `${minor ? "माता-पिता या अभिभावक इसे बच्चे के साथ मिलकर भरें। " : ""}यह निजी लिंक केवल आपके लिए है और ${expires} तक काम करेगा। पहले से चिकित्सा इतिहास, दवाइयों और जाँच की जानकारी होने से हम मुलाक़ात का समय सबसे ज़रूरी बातों पर लगा सकते हैं।`,
    help: (phone) => `यदि कोई प्रश्न हो या फ़ॉर्म भरने में कठिनाई हो, तो कृपया हमें${phone ? ` ${phone} पर` : ""} फ़ोन करें, हम सहर्ष सहायता करेंगे।`,
    button: "मेरी मुलाक़ात-पूर्व प्रश्नावली खोलें",
    regards: "सादर,",
    team: "और आपकी देखभाल टीम",
    eyebrow: "मुलाक़ात-पूर्व प्रश्नावली",
    footer: (expires, url) => `यह लिंक निजी है और ${expires} को समाप्त हो जाएगा। यदि बटन न खुले, तो यह पता अपने ब्राउज़र में कॉपी करें: ${url}`,
    noReply: (phone) => `यह ईमेल स्वचालित रूप से भेजा गया है, कृपया इसका उत्तर न दें। किसी भी प्रश्न के लिए हमारे कार्यालय में फ़ोन करें${phone ? `: ${phone}` : ""}।`,
    welcome: {
      subject: "स्वागत है — डॉ. ऐरन वे के कार्यालय से आपकी मुलाक़ात-पूर्व प्रश्नावली",
      intro: (first, minor, by) => `हमारे क्लिनिक में आपका स्वागत है। ${by ? `${by} ने ${minor ? `आपके बच्चे${first ? ` ${first}` : ""} को` : "आपको"} डॉ. ऐरन वे के पास भेजा है` : `${minor ? `आपके बच्चे${first ? ` ${first}` : ""} को` : "आपको"} डॉ. ऐरन वे के पास भेजा गया है`}, और हम आपसे मिलने के लिए उत्सुक हैं। परामर्श का समय तय करने के लिए फ़ोन करने से पहले, कृपया नीचे दिए गए सुरक्षित लिंक से मुलाक़ात-पूर्व प्रश्नावली भरें। इसमें लगभग 15–20 मिनट लगते हैं, उत्तर अपने-आप सहेजे जाते हैं, और इसे फ़ोन, टैबलेट या कंप्यूटर पर पूरा किया जा सकता है।`,
      about: (expires, minor) => `${minor ? "माता-पिता या अभिभावक इसे बच्चे के साथ मिलकर भरें। " : ""}यह निजी लिंक केवल आपके लिए है और ${expires} तक काम करेगा। आपके उत्तरों से हमारी टीम चिकित्सा इतिहास, दवाइयों और जाँच की जानकारी पहले से देख सकती है, ताकि हम परामर्श की ठीक से तैयारी करें और मुलाक़ात का समय सबसे ज़रूरी बातों पर लगाएँ।`,
      next: (phone) => `आपकी प्रश्नावली मिलते ही हमारा कार्यालय परामर्श का समय तय करने के लिए आपसे संपर्क करेगा। यदि कुछ कार्यदिवसों में हमारी ओर से संपर्क न हो, या कोई प्रश्न हो, तो कृपया हमें${phone ? ` ${phone} पर` : ""} फ़ोन करें।`,
      button: "मेरी मुलाक़ात-पूर्व प्रश्नावली भरें"
    }
  },
  ne: {
    subject: "तपाईंको भेटअघिको प्रश्नावली — डा. आरोन वेको कार्यालय",
    hello: (first, minor) => `नमस्ते${minor || !first ? "" : ` ${first} ज्यू`},`,
    intro: () => `हाम्रो क्लिनिक रोज्नुभएकोमा धन्यवाद। डा. वेसँगको आगामी भेटलाई अझ उपयोगी बनाउन, कृपया तलको सुरक्षित लिङ्कबाट भेटअघिको प्रश्नावली भर्नुहोस्। यसमा करिब १५–२० मिनेट लाग्छ, उत्तरहरू आफैँ सुरक्षित हुन्छन्, र फोन, ट्याब्लेट वा कम्प्युटरबाट पूरा गर्न सकिन्छ।`,
    about: (expires, minor) => `${minor ? "अभिभावकले बच्चासँगै मिलेर भर्नुहोस्। " : ""}यो निजी लिङ्क तपाईंका लागि मात्र हो र ${expires} सम्म काम गर्छ। रोगको इतिहास, औषधि र जाँचका विवरण पहिले नै थाहा हुँदा हामी भेटको समय सबैभन्दा महत्त्वपूर्ण कुरामा लगाउन सक्छौँ।`,
    help: (phone) => `कुनै प्रश्न भए वा फारम भर्न समस्या परे, कृपया हामीलाई${phone ? ` ${phone} मा` : ""} फोन गर्नुहोस्, हामी खुसीसाथ सहयोग गर्नेछौँ।`,
    button: "मेरो भेटअघिको प्रश्नावली खोल्नुहोस्",
    regards: "सादर,",
    team: "र तपाईंको हेरचाह टोली",
    eyebrow: "भेटअघिको प्रश्नावली",
    footer: (expires, url) => `यो लिङ्क निजी हो र ${expires} मा समाप्त हुन्छ। बटन नखुले यो ठेगाना ब्राउजरमा कपी गर्नुहोस्: ${url}`,
    noReply: (phone) => `यो इमेल स्वचालित रूपमा पठाइएको हो, कृपया जवाफ नदिनुहोस्। कुनै प्रश्न भए हाम्रो कार्यालयमा फोन गर्नुहोस्${phone ? `: ${phone}` : ""}।`,
    welcome: {
      subject: "स्वागत छ — डा. आरोन वेको कार्यालयबाट तपाईंको भेटअघिको प्रश्नावली",
      intro: (first, minor, by) => `हाम्रो क्लिनिकमा तपाईंलाई स्वागत छ। ${by ? `${by} ले ${minor ? `तपाईंको बच्चा${first ? ` ${first}` : ""} लाई` : "तपाईंलाई"} डा. आरोन वेकहाँ पठाउनुभएको छ` : `${minor ? `तपाईंको बच्चा${first ? ` ${first}` : ""} लाई` : "तपाईंलाई"} डा. आरोन वेकहाँ पठाइएको छ`}, र हामी तपाईंलाई भेट्न उत्सुक छौँ। परामर्शको समय मिलाउन फोन गर्नुअघि, कृपया तलको सुरक्षित लिङ्कबाट भेटअघिको प्रश्नावली भर्नुहोस्। यसमा करिब १५–२० मिनेट लाग्छ, उत्तरहरू आफैँ सुरक्षित हुन्छन्, र फोन, ट्याब्लेट वा कम्प्युटरबाट पूरा गर्न सकिन्छ।`,
      about: (expires, minor) => `${minor ? "अभिभावकले बच्चासँगै मिलेर भर्नुहोस्। " : ""}यो निजी लिङ्क तपाईंका लागि मात्र हो र ${expires} सम्म काम गर्छ। तपाईंका उत्तरहरूले हाम्रो टोलीलाई रोगको इतिहास, औषधि र जाँचका विवरण पहिले नै हेर्न दिन्छन्, जसले गर्दा हामी परामर्शको राम्रो तयारी गर्न र भेटको समय सबैभन्दा महत्त्वपूर्ण कुरामा लगाउन सक्छौँ।`,
      next: (phone) => `तपाईंको प्रश्नावली प्राप्त भएपछि हाम्रो कार्यालयले परामर्शको समय मिलाउन तपाईंलाई सम्पर्क गर्नेछ। केही कार्यदिनभित्र हामीबाट खबर नआए, वा कुनै प्रश्न भए, कृपया हामीलाई${phone ? ` ${phone} मा` : ""} फोन गर्नुहोस्।`,
      button: "मेरो भेटअघिको प्रश्नावली भर्नुहोस्"
    }
  }
};
const INTAKE_EMAIL_LANGUAGES = Object.keys(WORDS);
const NAVY = "#123559";
const TEAL = "#0e8482";
const INK = "#1f2937";
const SOFT = "#4b5563";
const WASH = "#f3f6f9";
const FONT = "Montserrat, 'Segoe UI', Helvetica, Arial, sans-serif";
const esc = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
function intakeEmail(d) {
  const first = d.patientFirstName.trim();
  const who = d.isMinor ? `${first || "your child"}'s` : "your";
  const lang = d.lang && WORDS[d.lang] ? d.lang : "en";
  const w = WORDS[lang];
  const rtl = RTL.has(lang);
  const x = EXTRA[lang] || EXTRA.en;
  const occasion = d.occasion || "visit";
  const referral = occasion === "referral";
  const phone = d.officePhone || "";
  const greeting = w.hello(first, d.isMinor);
  let subject, intro, about, help, button, footer;
  if (occasion === "express") {
    subject = w.welcome.subject;
    intro = d.isMinor ? x.expressIntroChild : x.expressIntroAdult;
    about = d.siteLink ? x.siteAbout : w.welcome.about(d.expires, d.isMinor);
    help = x.expressNext.replace("{phone}", phone);
    button = w.welcome.button;
    footer = d.siteLink ? x.siteFooter.replace("{url}", d.url) : w.footer(d.expires, d.url);
  } else if (occasion === "resume") {
    subject = w.subject;
    intro = x.resumeIntro;
    about = w.about(d.expires, d.isMinor, first);
    help = w.help(phone);
    button = w.button;
    footer = w.footer(d.expires, d.url);
  } else {
    subject = referral ? w.welcome.subject : w.subject;
    intro = referral ? w.welcome.intro(first, d.isMinor, d.referredBy?.trim() || null) : w.intro(who);
    about = referral ? w.welcome.about(d.expires, d.isMinor) : w.about(d.expires, d.isMinor, first);
    help = referral ? w.welcome.next(phone) : w.help(phone);
    button = referral ? w.welcome.button : w.button;
    footer = w.footer(d.expires, d.url);
  }
  const noReply = w.noReply(d.officePhone);
  // Chinese readers see the surname Dr. Wey uses in Chinese, with the Latin name once.
  const signName = lang === "zh" ? "魏医生（Aaron Wey）" : "Dr. Aaron Wey";
  const office = [SURGEON.name, "Adult and Pediatric Spine Surgery", "Holy Name Medical Center", "Clinic Office: 870 Palisade Ave, Teaneck, NJ 07666", ...d.officePhone ? [`Office Phone: ${d.officePhone}`] : []];
  const ascii = (t) => t.replace(/—/g, "-").replace(/–/g, "-").replace(/·/g, ",").replace(/’/g, "'");
  const text = [greeting, "", ascii(intro), "", `${w.eyebrow}: ${d.url}`, "", ascii(about), "", ascii(help), "", w.regards, "", signName, w.team, "", ...office, "", ascii(noReply)].join("\n");
  const dir = rtl ? "direction:rtl;text-align:right;" : "";
  const p = (t, extra = "") => `<p style="margin:0 0 16px 0;font-family:${FONT};font-size:15px;line-height:1.6;color:${INK};${dir}${extra}">${esc(t)}</p>`;
  const html = `<!DOCTYPE html>
<html lang="${lang}"${rtl ? ' dir="rtl"' : ""}>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(subject)}</title>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap" rel="stylesheet"></head>
<body style="margin:0;padding:0;background:${WASH};">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${WASH};padding:28px 12px;">
<tr><td align="center">
<table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 2px 10px rgba(18,53,89,0.08);">
  <tr><td style="background:${NAVY};padding:22px 32px;">
    ${d.logoUrl ? `<img src="${esc(d.logoUrl)}" alt="Holy Name Medical Center" width="150" style="display:block;width:150px;height:auto;border:0;margin-bottom:10px;background:#ffffff;padding:6px 10px;border-radius:8px;">` : ""}
    <div style="font-family:${FONT};font-size:17px;font-weight:700;color:#ffffff;">${esc(SURGEON.name)}</div>
    <div style="font-family:${FONT};font-size:12px;color:#cfe3e2;letter-spacing:0.3px;">${esc(SURGEON.title)}</div>
  </td></tr>
  <tr><td style="height:4px;background:${TEAL};"></td></tr>
  <tr><td style="padding:32px 32px 8px 32px;">
    <div style="font-family:${FONT};font-size:12px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:${TEAL};margin-bottom:10px;${dir}">${esc(w.eyebrow)}</div>
    ${p(greeting)}
    ${p(intro)}
    <table role="presentation" cellspacing="0" cellpadding="0" style="margin:6px 0 22px 0;" ${rtl ? 'align="right"' : ""}><tr><td style="border-radius:10px;background:${TEAL};">
      <a href="${esc(d.url)}" style="display:inline-block;padding:14px 26px;font-family:${FONT};font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:10px;">${esc(button)}</a>
    </td></tr></table>
    ${p(about)}
    ${p(help)}
    ${p(w.regards, "margin-bottom:14px")}
    ${p(signName, `font-weight:600;color:${NAVY};margin-bottom:0`)}
    ${p(w.team, `color:${NAVY}`)}
  </td></tr>
  <tr><td style="padding:18px 32px 26px 32px;border-top:1px solid #e3e9ef;">
    ${office.map((l) => `<div style="font-family:${FONT};font-size:12px;line-height:1.6;color:${SOFT};">${esc(l)}</div>`).join("")}
    <div style="font-family:${FONT};font-size:12px;line-height:1.6;color:${SOFT};margin-top:12px;font-weight:600;${dir}">${esc(noReply)}</div>
    <div style="font-family:${FONT};font-size:11px;line-height:1.6;color:#8a97a6;margin-top:10px;${dir}">${esc(footer)}</div>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`;
  return { subject, text, html };
}
export { INTAKE_EMAIL_LANGUAGES, intakeEmail };
