// The sentences the intake adds to Practice Hub's letter (welcome after Book a consult, finish-later,
// another site's link), in the twelve languages. Generated 2026-11-01 with Claude on Bedrock from the
// English; not yet reviewed by a translator. Edit by hand to correct one.
const EXTRA = {
  "en": {
    "expressIntroAdult": "Welcome, and thank you for reaching out to Dr. Aaron Wey's office. We look forward to meeting you. A member of our team will call you within 24 to 48 hours to set up your consultation. Before then, please complete your pre-visit questionnaire using the secure button below. It takes about 15 to 20 minutes, saves as you go, and works on a phone, tablet or computer.",
    "expressIntroChild": "Welcome, and thank you for reaching out to Dr. Aaron Wey's office. We look forward to meeting you and your child. A member of our team will call you within 24 to 48 hours to set up the consultation. Before then, please complete the pre-visit questionnaire together with your child, using the secure button below. It takes about 15 to 20 minutes, saves as you go, and works on a phone, tablet or computer.",
    "expressNext": "If anything comes up before we call, please phone us at {phone}; we are glad to help.",
    "resumeIntro": "Here is the link to pick up your pre-visit questionnaire where you left off. It opens the answers you have already given, so please keep it to yourself.",
    "siteAbout": "The questionnaire saves as you go and works on a phone, tablet or computer. Your answers let our team review the history, medications and any imaging ahead of time, so we can prepare properly for the consultation.",
    "siteFooter": "If the button does not open, copy this address into your browser: {url}"
  },
  "es": {
    "expressIntroAdult": "Bienvenido/a, y gracias por comunicarse con el consultorio del Dr. Aaron Wey. Será un gusto atenderle. Un miembro de nuestro equipo le llamará en un plazo de 24 a 48 horas para programar su consulta. Antes de esa llamada, le pedimos que complete su cuestionario de pre-visita usando el botón seguro que aparece a continuación. Toma aproximadamente 15 a 20 minutos, guarda su progreso automáticamente y funciona en teléfono, tableta o computadora.",
    "expressIntroChild": "Bienvenido/a, y gracias por comunicarse con el consultorio del Dr. Aaron Wey. Será un gusto atenderle a usted y a su hijo/a. Un miembro de nuestro equipo le llamará en un plazo de 24 a 48 horas para programar la consulta. Antes de esa llamada, le pedimos que complete el cuestionario de pre-visita junto con su hijo/a, usando el botón seguro que aparece a continuación. Toma aproximadamente 15 a 20 minutos, guarda su progreso automáticamente y funciona en teléfono, tableta o computadora.",
    "expressNext": "Si surge alguna pregunta antes de que nos comuniquemos con usted, no dude en llamarnos al {phone}; con mucho gusto le atenderemos.",
    "resumeIntro": "A continuación encontrará el enlace para continuar su cuestionario de pre-visita desde donde lo dejó. Al abrirlo, encontrará las respuestas que ya ingresó, por lo que le pedimos mantenerlo de manera confidencial.",
    "siteAbout": "El cuestionario guarda su progreso automáticamente y funciona en teléfono, tableta o computadora. Sus respuestas permiten a nuestro equipo revisar con anticipación su historial, medicamentos e imágenes diagnósticas, a fin de prepararnos adecuadamente para su consulta.",
    "siteFooter": "Si el botón no abre, copie esta dirección en su navegador: {url}"
  },
  "zh": {
    "expressIntroAdult": "欢迎您，感谢您联系 Aaron Wey 医生诊所。我们期待与您见面。我们的团队成员将在 24 至 48 小时内致电您，为您安排会诊时间。在此之前，请通过下方的安全按钮填写就诊前问卷。问卷约需 15 至 20 分钟，填写过程中会自动保存，支持手机、平板电脑及电脑使用。",
    "expressIntroChild": "欢迎您，感谢您联系 Aaron Wey 医生诊所。我们期待与您和您的孩子见面。我们的团队成员将在 24 至 48 小时内致电您，为您安排会诊时间。在此之前，请与您的孩子一同通过下方的安全按钮填写就诊前问卷。问卷约需 15 至 20 分钟，填写过程中会自动保存，支持手机、平板电脑及电脑使用。",
    "expressNext": "如果在我们致电之前您有任何疑问，欢迎随时拨打 {phone} 与我们联系，我们很乐意为您提供帮助。",
    "resumeIntro": "以下是继续填写就诊前问卷的链接，点击后将显示您已填写的内容，请妥善保管，勿与他人分享。",
    "siteAbout": "问卷填写过程中会自动保存，支持手机、平板电脑及电脑使用。您的回答将帮助我们的团队提前了解您的病史、用药情况及相关影像资料，以便为会诊做好充分准备。",
    "siteFooter": "如果按钮无法打开，请将以下地址复制到您的浏览器中：{url}"
  },
  "pt": {
    "expressIntroAdult": "Seja bem-vindo(a), e obrigado(a) por entrar em contato com o consultório do Dr. Aaron Wey. Teremos muito prazer em recebê-lo(a). Um membro da nossa equipe entrará em contato por telefone em até 24 a 48 horas para agendar a sua consulta. Enquanto isso, pedimos que preencha o questionário pré-consulta utilizando o botão seguro abaixo. O preenchimento leva aproximadamente 15 a 20 minutos, é salvo automaticamente conforme você avança e pode ser realizado pelo celular, tablet ou computador.",
    "expressIntroChild": "Seja bem-vindo(a), e obrigado(a) por entrar em contato com o consultório do Dr. Aaron Wey. Teremos muito prazer em receber você e seu filho(a). Um membro da nossa equipe entrará em contato por telefone em até 24 a 48 horas para agendar a consulta. Enquanto isso, pedimos que preencha o questionário pré-consulta junto com seu filho(a), utilizando o botão seguro abaixo. O preenchimento leva aproximadamente 15 a 20 minutos, é salvo automaticamente conforme você avança e pode ser realizado pelo celular, tablet ou computador.",
    "expressNext": "Caso surja qualquer dúvida antes do nosso contato, não hesite em nos ligar pelo número {phone}; teremos prazer em ajudá-lo(a).",
    "resumeIntro": "Segue abaixo o link para continuar o preenchimento do seu questionário pré-consulta de onde você parou. Ele abrirá as respostas que você já forneceu, portanto pedimos que mantenha este link em sigilo.",
    "siteAbout": "O questionário é salvo automaticamente conforme você avança e pode ser preenchido pelo celular, tablet ou computador. Suas respostas permitem que nossa equipe revise o histórico, os medicamentos em uso e eventuais exames de imagem com antecedência, para que possamos nos preparar adequadamente para a consulta.",
    "siteFooter": "Caso o botão não funcione, copie o endereço abaixo e cole diretamente no seu navegador: {url}"
  },
  "ko": {
    "expressIntroAdult": "안녕하세요. Aaron Wey 박사 진료실에 연락해 주셔서 감사합니다. 곧 뵙게 되기를 기대하고 있습니다. 저희 팀 직원이 24시간에서 48시간 이내에 전화를 드려 상담 일정을 안내해 드릴 예정입니다. 그 전에 아래의 보안 버튼을 이용하여 사전 문진표를 작성해 주시기 바랍니다. 작성에는 약 15분에서 20분이 소요되며, 작성 중 자동으로 저장되고, 휴대폰, 태블릿, 컴퓨터 모두에서 이용하실 수 있습니다.",
    "expressIntroChild": "안녕하세요. Aaron Wey 박사 진료실에 연락해 주셔서 감사합니다. 곧 환자분과 자녀분을 뵙게 되기를 기대하고 있습니다. 저희 팀 직원이 24시간에서 48시간 이내에 전화를 드려 상담 일정을 안내해 드릴 예정입니다. 그 전에 아래의 보안 버튼을 이용하여 자녀분과 함께 사전 문진표를 작성해 주시기 바랍니다. 작성에는 약 15분에서 20분이 소요되며, 작성 중 자동으로 저장되고, 휴대폰, 태블릿, 컴퓨터 모두에서 이용하실 수 있습니다.",
    "expressNext": "저희가 연락드리기 전에 문의 사항이 생기시면 {phone}으로 전화해 주시기 바랍니다. 언제든지 도움을 드리겠습니다.",
    "resumeIntro": "이전에 작성하시던 사전 문진표를 이어서 작성하실 수 있는 링크를 보내드립니다. 이 링크를 열면 이미 입력하신 내용이 그대로 표시되오니, 본인만 사용하시기 바랍니다.",
    "siteAbout": "문진표는 작성 중 자동으로 저장되며, 휴대폰, 태블릿, 컴퓨터 모두에서 이용하실 수 있습니다. 작성해 주신 내용을 바탕으로 저희 팀이 상담 전에 병력, 복용 중인 약물, 영상 검사 결과 등을 미리 검토하여 충분히 준비할 수 있습니다.",
    "siteFooter": "버튼이 열리지 않는 경우, 다음 주소를 브라우저에 직접 입력해 주시기 바랍니다: {url}"
  },
  "ru": {
    "expressIntroAdult": "Добро пожаловать, и благодарим вас за обращение в кабинет Dr. Aaron Wey. Мы с нетерпением ждём встречи с вами. Сотрудник нашей клиники свяжется с вами по телефону в течение 24–48 часов для записи на консультацию. До этого момента, пожалуйста, заполните предварительную анкету пациента, воспользовавшись защищённой кнопкой ниже. Заполнение занимает около 15–20 минут, ваши ответы сохраняются автоматически, и анкета доступна на телефоне, планшете или компьютере.",
    "expressIntroChild": "Добро пожаловать, и благодарим вас за обращение в кабинет Dr. Aaron Wey. Мы с нетерпением ждём встречи с вами и вашим ребёнком. Сотрудник нашей клиники свяжется с вами по телефону в течение 24–48 часов для записи на консультацию. До этого момента, пожалуйста, заполните предварительную анкету пациента вместе с вашим ребёнком, воспользовавшись защищённой кнопкой ниже. Заполнение занимает около 15–20 минут, ваши ответы сохраняются автоматически, и анкета доступна на телефоне, планшете или компьютере.",
    "expressNext": "Если у вас возникнут вопросы до нашего звонка, пожалуйста, свяжитесь с нами по телефону {phone} — мы будем рады помочь.",
    "resumeIntro": "Перейдите по ссылке ниже, чтобы продолжить заполнение предварительной анкеты с того места, на котором вы остановились. Ссылка открывает уже введённые вами ответы, поэтому просим вас не передавать её третьим лицам.",
    "siteAbout": "Анкета сохраняется автоматически по мере заполнения и доступна на телефоне, планшете или компьютере. Ваши ответы позволяют нашей команде заблаговременно ознакомиться с историей болезни, принимаемыми препаратами и результатами визуализирующих исследований, чтобы должным образом подготовиться к консультации.",
    "siteFooter": "Если кнопка не открывается, скопируйте следующий адрес в адресную строку браузера: {url}"
  },
  "pl": {
    "expressIntroAdult": "Witamy i dziękujemy za kontakt z gabinetem Dr. Aarona Weya. Cieszymy się na spotkanie z Państwem. Członek naszego zespołu skontaktuje się z Państwem telefonicznie w ciągu 24 do 48 godzin, aby ustalić termin konsultacji. Prosimy wcześniej o wypełnienie kwestionariusza przed wizytą, korzystając z bezpiecznego przycisku poniżej. Wypełnienie zajmuje około 15 do 20 minut, postęp jest zapisywany na bieżąco, a kwestionariusz działa na telefonie, tablecie lub komputerze.",
    "expressIntroChild": "Witamy i dziękujemy za kontakt z gabinetem Dr. Aarona Weya. Cieszymy się na spotkanie z Państwem i Państwa dzieckiem. Członek naszego zespołu skontaktuje się z Państwem telefonicznie w ciągu 24 do 48 godzin, aby ustalić termin konsultacji. Prosimy wcześniej o wspólne wypełnienie kwestionariusza przed wizytą wraz z dzieckiem, korzystając z bezpiecznego przycisku poniżej. Wypełnienie zajmuje około 15 do 20 minut, postęp jest zapisywany na bieżąco, a kwestionariusz działa na telefonie, tablecie lub komputerze.",
    "expressNext": "Jeśli w międzyczasie pojawią się jakiekolwiek pytania, prosimy o kontakt telefoniczny pod numer {phone} – chętnie służymy pomocą.",
    "resumeIntro": "Poniżej znajduje się link umożliwiający powrót do kwestionariusza przed wizytą w miejscu, w którym Państwo skończyli. Otwiera on wcześniej udzielone odpowiedzi, dlatego prosimy o zachowanie go dla siebie.",
    "siteAbout": "Kwestionariusz zapisuje postęp na bieżąco i działa na telefonie, tablecie lub komputerze. Udzielone odpowiedzi pozwalają naszemu zespołowi zapoznać się wcześniej z historią choroby, przyjmowanymi lekami oraz ewentualną dokumentacją obrazową, dzięki czemu możemy odpowiednio przygotować się do konsultacji.",
    "siteFooter": "Jeśli przycisk nie otwiera się prawidłowo, prosimy skopiować poniższy adres do przeglądarki internetowej: {url}"
  },
  "ar": {
    "expressIntroAdult": "أهلاً وسهلاً بكم، ونشكركم على تواصلكم مع عيادة Dr. Aaron Wey. يسعدنا الترحيب بكم. سيتصل بكم أحد أعضاء فريقنا خلال أربعٍ وعشرين إلى ثمانٍ وأربعين ساعة لتحديد موعد استشارتكم. وقبل ذلك، نرجو منكم التكرم بتعبئة استبيان ما قبل الزيارة عبر الزر الآمن أدناه. يستغرق الاستبيان نحو خمس عشرة إلى عشرين دقيقة، ويحفظ إجاباتكم تلقائياً أثناء التعبئة، ويمكن استخدامه على الهاتف أو الجهاز اللوحي أو الحاسوب.",
    "expressIntroChild": "أهلاً وسهلاً بكم، ونشكركم على تواصلكم مع عيادة Dr. Aaron Wey. يسعدنا الترحيب بكم وبطفلكم الكريم. سيتصل بكم أحد أعضاء فريقنا خلال أربعٍ وعشرين إلى ثمانٍ وأربعين ساعة لتحديد موعد الاستشارة. وقبل ذلك، نرجو منكم التكرم بتعبئة استبيان ما قبل الزيارة بالتعاون مع طفلكم، وذلك عبر الزر الآمن أدناه. يستغرق الاستبيان نحو خمس عشرة إلى عشرين دقيقة، ويحفظ إجاباتكم تلقائياً أثناء التعبئة، ويمكن استخدامه على الهاتف أو الجهاز اللوحي أو الحاسوب.",
    "expressNext": "إن احتجتم إلى أي مساعدة قبل أن نتصل بكم، يُرجى الاتصال بنا على الرقم {phone}؛ ويسعدنا دائماً تقديم المساعدة.",
    "resumeIntro": "نُرفق إليكم الرابط للمتابعة من حيث توقفتم في استبيان ما قبل الزيارة. يتيح لكم هذا الرابط استعراض الإجابات التي أدخلتموها مسبقاً، لذا نرجو الحفاظ على سريته وعدم مشاركته مع الآخرين.",
    "siteAbout": "يحفظ الاستبيان إجاباتكم تلقائياً أثناء التعبئة، ويمكن استخدامه على الهاتف أو الجهاز اللوحي أو الحاسوب. تُمكّن إجاباتكم فريقنا من مراجعة تاريخكم الطبي والأدوية وأي صور تشخيصية مسبقاً، مما يتيح لنا الاستعداد الجيد للاستشارة.",
    "siteFooter": "إن لم يعمل الزر، يُرجى نسخ هذا العنوان ولصقه في متصفحكم: {url}"
  },
  "he": {
    "expressIntroAdult": "ברוכים הבאים, ותודה שפניתם למרפאתו של Dr. Aaron Wey. אנו מצפים לפגוש אתכם. אחד מחברי הצוות שלנו יצור אתכם קשר טלפוני תוך 24 עד 48 שעות לתיאום הייעוץ. עד אז, אנא מלאו את שאלון הטרום-ביקור באמצעות הכפתור המאובטח שלהלן. המילוי אורך כ-15 עד 20 דקות, נשמר תוך כדי הכתיבה, ומתאים לשימוש בטלפון, בטאבלט או במחשב.",
    "expressIntroChild": "ברוכים הבאים, ותודה שפניתם למרפאתו של Dr. Aaron Wey. אנו מצפים לפגוש אתכם ואת ילדכם. אחד מחברי הצוות שלנו יצור אתכם קשר טלפוני תוך 24 עד 48 שעות לתיאום הייעוץ. עד אז, אנא מלאו את שאלון הטרום-ביקור יחד עם ילדכם, באמצעות הכפתור המאובטח שלהלן. המילוי אורך כ-15 עד 20 דקות, נשמר תוך כדי הכתיבה, ומתאים לשימוש בטלפון, בטאבלט או במחשב.",
    "expressNext": "אם תזדקקו לסיוע לפני שניצור אתכם קשר, אנא התקשרו אלינו במספר {phone}; נשמח לעמוד לרשותכם.",
    "resumeIntro": "מצורף הקישור להמשך מילוי שאלון הטרום-ביקור מהמקום שבו הפסקתם. הקישור יפתח את התשובות שכבר מסרתם, ולכן אנא שמרו אותו לעצמכם.",
    "siteAbout": "השאלון נשמר תוך כדי הכתיבה ומתאים לשימוש בטלפון, בטאבלט או במחשב. תשובותיכם מאפשרות לצוות שלנו לעיין מראש בהיסטוריה הרפואית, בתרופות ובכל בדיקות ההדמיה, כדי שנוכל להתכונן כראוי לקראת הייעוץ.",
    "siteFooter": "אם הכפתור אינו נפתח, אנא העתיקו את הכתובת הבאה לדפדפן שלכם: {url}"
  },
  "ja": {
    "expressIntroAdult": "この度はAaron Wey医師の診療所へお問い合わせいただき、誠にありがとうございます。スタッフ一同、皆様にお会いできることを楽しみにしております。担当スタッフより24時間から48時間以内にお電話を差し上げ、診察のご予約をお取りいたします。お電話の前に、下記のセキュリティで保護されたボタンより、初診前アンケートのご記入をお願いいたします。所要時間は約15分から20分で、途中保存が可能です。スマートフォン、タブレット、パソコンのいずれからでもご利用いただけます。",
    "expressIntroChild": "この度はAaron Wey医師の診療所へお問い合わせいただき、誠にありがとうございます。スタッフ一同、お子様とともに皆様にお会いできることを楽しみにしております。担当スタッフより24時間から48時間以内にお電話を差し上げ、診察のご予約をお取りいたします。お電話の前に、下記のセキュリティで保護されたボタンより、お子様とご一緒に初診前アンケートのご記入をお願いいたします。所要時間は約15分から20分で、途中保存が可能です。スマートフォン、タブレット、パソコンのいずれからでもご利用いただけます。",
    "expressNext": "ご連絡の前にご不明な点やご用件がございましたら、{phone}までお気軽にお電話ください。何かとお役に立てれば幸いでございます。",
    "resumeIntro": "初診前アンケートの続きからご回答いただくためのリンクをお送りいたします。これまでにご入力いただいた内容が表示されますので、リンクは他の方と共有されないようお取り扱いくださいますようお願いいたします。",
    "siteAbout": "アンケートは途中保存が可能で、スマートフォン、タブレット、パソコンのいずれからでもご利用いただけます。ご回答いただいた内容をもとに、担当スタッフが診察に先立ち、既往歴・お薬の内容・画像検査の結果などを事前に確認し、万全の準備を整えてお迎えいたします。",
    "siteFooter": "ボタンが開かない場合は、次のアドレスをブラウザにコピーしてご利用ください：{url}"
  },
  "hi": {
    "expressIntroAdult": "आपका स्वागत है, और Dr. Aaron Wey के कार्यालय से संपर्क करने के लिए आपका धन्यवाद। हम आपसे मिलने की प्रतीक्षा कर रहे हैं। हमारी टीम का एक सदस्य आपकी परामर्श नियुक्ति निर्धारित करने के लिए 24 से 48 घंटों के भीतर आपको फ़ोन करेगा। उससे पहले, कृपया नीचे दिए गए सुरक्षित बटन का उपयोग करके अपना प्रारंभिक-भेंट प्रश्नावली फ़ॉर्म पूरा करें। इसे भरने में लगभग 15 से 20 मिनट लगते हैं, यह भरते-भरते स्वतः सहेजता रहता है, और मोबाइल फ़ोन, टैबलेट या कंप्यूटर — किसी पर भी उपयोग किया जा सकता है।",
    "expressIntroChild": "आपका स्वागत है, और Dr. Aaron Wey के कार्यालय से संपर्क करने के लिए आपका धन्यवाद। हम आपसे और आपके बच्चे से मिलने की प्रतीक्षा कर रहे हैं। हमारी टीम का एक सदस्य परामर्श नियुक्ति निर्धारित करने के लिए 24 से 48 घंटों के भीतर आपको फ़ोन करेगा। उससे पहले, कृपया अपने बच्चे के साथ मिलकर नीचे दिए गए सुरक्षित बटन का उपयोग करके प्रारंभिक-भेंट प्रश्नावली फ़ॉर्म पूरा करें। इसे भरने में लगभग 15 से 20 मिनट लगते हैं, यह भरते-भरते स्वतः सहेजता रहता है, और मोबाइल फ़ोन, टैबलेट या कंप्यूटर — किसी पर भी उपयोग किया जा सकता है।",
    "expressNext": "यदि हमारे फ़ोन करने से पहले आपको किसी सहायता की आवश्यकता हो, तो कृपया हमें {phone} पर संपर्क करें; हम आपकी सहायता करके प्रसन्न होंगे।",
    "resumeIntro": "आपकी प्रारंभिक-भेंट प्रश्नावली को वहीं से आगे जारी रखने का लिंक यहाँ दिया गया है जहाँ आपने छोड़ा था। यह आपके द्वारा पहले से दिए गए उत्तरों को खोलता है, इसलिए कृपया इस लिंक को अपने तक ही सीमित रखें।",
    "siteAbout": "प्रश्नावली भरते-भरते स्वतः सहेजती रहती है और मोबाइल फ़ोन, टैबलेट या कंप्यूटर — किसी पर भी उपयोग की जा सकती है। आपके उत्तरों से हमारी टीम को परामर्श से पूर्व आपका चिकित्सा इतिहास, दवाइयाँ और किसी भी इमेजिंग की समीक्षा करने में सहायता मिलती है, जिससे हम परामर्श के लिए भली-भाँति तैयार हो सकें।",
    "siteFooter": "यदि बटन नहीं खुलता, तो कृपया इस पते को अपने ब्राउज़र में कॉपी करें: {url}"
  },
  "ne": {
    "expressIntroAdult": "स्वागत छ, र Dr. Aaron Wey को कार्यालयमा सम्पर्क गर्नुभएकोमा हार्दिक धन्यवाद। हामी васलाई भेट्न उत्सुक छौं। हाम्रो टोलीका एक सदस्यले २४ देखि ४८ घण्टाभित्र तपाईंको परामर्श मिलाउन फोन गर्नेछन्। त्यसअघि, कृपया तलको सुरक्षित बटन प्रयोग गरी आफ्नो भ्रमणपूर्व प्रश्नावली पूरा गर्नुहोस्। यसमा लगभग १५ देखि २० मिनेट लाग्छ, भर्दै जाँदा स्वतः सुरक्षित हुन्छ, र फोन, ट्याब्लेट वा कम्प्युटर सबैमा काम गर्छ।",
    "expressIntroChild": "स्वागत छ, र Dr. Aaron Wey को कार्यालयमा सम्पर्क गर्नुभएकोमा हार्दिक धन्यवाद। हामी तपाईं र तपाईंको बच्चालाई भेट्न उत्सुक छौं। हाम्रो टोलीका एक सदस्यले २४ देखि ४८ घण्टाभित्र परामर्श मिलाउन फोन गर्नेछन्। त्यसअघि, कृपया तलको सुरक्षित बटन प्रयोग गरी आफ्नो बच्चासँगै भ्रमणपूर्व प्रश्नावली पूरा गर्नुहोस्। यसमा लगभग १५ देखि २० मिनेट लाग्छ, भर्दै जाँदा स्वतः सुरक्षित हुन्छ, र फोन, ट्याब्लेट वा कम्प्युटर सबैमा काम गर्छ।",
    "expressNext": "हामीले फोन गर्नुअघि कुनै कुरा आवश्यक परेमा, कृपया हामीलाई {phone} मा फोन गर्नुहोस्; हामी सहयोग गर्न सदैव तत्पर छौं।",
    "resumeIntro": "तपाईंले छोड्नुभएको ठाउँबाट भ्रमणपूर्व प्रश्नावली जारी राख्नको लागि यहाँ लिङ्क छ। यसले तपाईंले पहिले नै दिनुभएका उत्तरहरू खोल्छ, त्यसैले कृपया यो लिङ्क आफैंसँग मात्र राख्नुहोस्।",
    "siteAbout": "प्रश्नावली भर्दै जाँदा स्वतः सुरक्षित हुन्छ र फोन, ट्याब्लेट वा कम्प्युटर सबैमा काम गर्छ। तपाईंका उत्तरहरूले हाम्रो टोलीलाई परामर्शको तयारी राम्रोसँग गर्न इतिहास, औषधिहरू र कुनै पनि इमेजिङ अगावै समीक्षा गर्न सहयोग पुर्‍याउँछ।",
    "siteFooter": "बटनले नखुलेमा, यो ठेगाना आफ्नो ब्राउजरमा टाँस्नुहोस्: {url}"
  }
};
export default EXTRA;
