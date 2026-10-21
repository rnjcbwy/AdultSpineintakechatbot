'use client';

import { useIntake } from '../../../lib/store';
import { useLang, makeT, COMMON } from '../../../lib/i18n';
import StepNavigation from '../../ui/StepNavigation';
import { TextField, TextArea } from '../../ui/Fields';
import {
  DIAGNOSIS_OPTIONS, DX, VISIT_GOAL_OPTIONS, YES_NO_UNSURE,
  SPINE_HISTORY, INTERVAL_HISTORY, POSTOP_HISTORY, pedsSectionFor,
} from '../../../lib/services/peds-spine/pedsHistory';

// ============================================================================
// The pediatric spine history, ported from the pediatric spine intake's
// spineHistory, intervalHistory and postopHistory views. Parent-facing
// wording ("your child"); answers stored in English under data.pedsSpine.
//
// The shared steps already cover where it hurts (body map), when it started,
// how bad it is, what it feels like and whether it travels (symptom details),
// physical therapy, chiropractic care, injections, medicines and imaging
// (treatments and records). None of that is asked again: this step holds
// what a growing spine adds, and says where the rest was asked.
//
// Which section shows depends on the kind of visit (lib/flows.js):
//   new, new problem, work or legal claim   -> pedsSpine.history
//   follow-up (after the shared interval step) -> pedsSpine.interval
//   after surgery (after the shared recovery step) -> pedsSpine.postop
// ============================================================================

const LOCAL = {
  // ---- Headings and link sentences ----
  'The spine story so far': { es: 'La historia de la columna hasta ahora', zh: '脊柱问题的经过' },
  'Since the last visit: the spine': { es: 'Desde la última consulta: la columna', zh: '自上次就诊以来：脊柱情况' },
  'After surgery: how the recovery is going': { es: 'Después de la cirugía: cómo va la recuperación', zh: '术后：恢复情况' },
  'Tap what fits. Everything is optional, and you can add more in your own words at the end.': { es: 'Toque lo que corresponda. Todo es opcional y al final puede agregar más con sus propias palabras.', zh: '点选符合的项目。所有问题均为选填，最后可以用自己的话补充。' },
  'Where it hurts, how bad it is, when it started and whether it travels into the legs were covered on the symptom map and symptom details, so they are not asked again here.': { es: 'Dónde duele, qué tan fuerte es, cuándo empezó y si se extiende a las piernas ya se cubrieron en el mapa de síntomas y los detalles de los síntomas, así que no se vuelven a preguntar aquí.', zh: '疼痛的部位、程度、开始时间以及是否放射到腿部已在症状图和症状详情中填写，这里不再重复询问。' },
  'Physical therapy, chiropractic care, injections and medicines are asked on the treatments page; imaging can be listed there and uploaded on the records page.': { es: 'La fisioterapia, la quiropráctica, las inyecciones y los medicamentos se preguntan en la página de tratamientos; los estudios de imagen pueden indicarse allí y subirse en la página de registros.', zh: '物理治疗、整脊、注射和药物在治疗页面询问；影像检查可以在那里列出并在病历资料页面上传。' },
  'The previous page covered what has changed, where it hurts now and what was tried in between. These are the questions specific to a growing spine.': { es: 'La página anterior cubrió qué ha cambiado, dónde duele ahora y qué se probó entre consultas. Estas son las preguntas específicas de una columna en crecimiento.', zh: '上一页已经填写了有哪些变化、现在哪里疼以及期间尝试过的治疗。以下是针对生长中脊柱的专门问题。' },
  "The previous page covered the operation, the incision, your child's symptoms now and the medicines. These are the questions specific to a child's recovery.": { es: 'La página anterior cubrió la operación, la incisión, los síntomas actuales de su hijo/a y los medicamentos. Estas son las preguntas específicas de la recuperación de un niño.', zh: '上一页已经填写了手术、切口、孩子目前的症状和药物。以下是针对儿童康复的专门问题。' },
  'Choose up to three.': { es: 'Elija hasta tres.', zh: '最多选三项。' },
  'Something else you are hoping for (optional)': { es: 'Otra cosa que espera de la consulta (opcional)', zh: '其他期望（选填）' },
  'What are you hoping for from the visit?': { es: '¿Qué espera de la consulta?', zh: '您希望这次就诊解决什么？' },
  'What have you been told so far?': { es: '¿Qué le han dicho hasta ahora?', zh: '到目前为止医生怎么说？' },
  'If a doctor has given the problem a name, choose the closest one. "Other or not sure" is a fine answer.': { es: 'Si un médico le ha puesto un nombre al problema, elija el más parecido. "Otro o no estoy seguro/a" es una respuesta válida.', zh: '如果医生已对问题作出诊断，请选最接近的一项。"其他或不确定"也是可以的答案。' },
  'How it started': { es: 'Cómo empezó', zh: '问题的开始' },
  'How was it first noticed?': { es: '¿Cómo se notó por primera vez?', zh: '最初是怎么发现的？' },
  'What have you noticed about the back or posture?': { es: '¿Qué ha notado en la espalda o la postura?', zh: '您注意到背部或姿势有什么异常？' },
  'Pain': { es: 'Dolor', zh: '疼痛' },
  'Does your child have back, neck or leg pain?': { es: '¿Su hijo/a tiene dolor de espalda, cuello o piernas?', zh: '孩子有背痛、颈痛或腿痛吗？' },
  'How often?': { es: '¿Con qué frecuencia?', zh: '多久发生一次？' },
  'What makes it worse?': { es: '¿Qué lo empeora?', zh: '什么会加重疼痛？' },
  'What makes it better?': { es: '¿Qué lo alivia?', zh: '什么能缓解疼痛？' },
  'Does the pain wake your child from sleep?': { es: '¿El dolor despierta a su hijo/a por la noche?', zh: '疼痛会把孩子从睡梦中痛醒吗？' },
  'Walking, balance and general health': { es: 'Caminar, equilibrio y salud general', zh: '行走、平衡和总体健康' },
  'Has your child had any of these?': { es: '¿Su hijo/a ha tenido alguno de estos?', zh: '孩子有过以下情况吗？' },
  'Any of these since the last visit?': { es: '¿Alguno de estos desde la última consulta?', zh: '自上次就诊以来有以下情况吗？' },
  'Imaging and records': { es: 'Estudios de imagen y registros', zh: '影像检查与病历' },
  'If a report gives a curve measurement, what was it?': { es: 'Si un informe indica una medida de la curva, ¿cuál fue?', zh: '如果报告中有弯曲角度的测量值，是多少？' },
  'e.g., 28 degrees': { es: 'p. ej., 28 grados', zh: '例如：28度' },
  'Do you have the actual images?': { es: '¿Tiene las imágenes en sí?', zh: '您有实际的影像资料吗？' },
  'The images themselves, not just the report, are what matter for the visit. If you do not have them, the imaging center can put them on a CD or USB for you.': { es: 'Lo que importa para la consulta son las imágenes en sí, no solo el informe. Si no las tiene, el centro de imágenes puede grabarlas en un CD o USB.', zh: '就诊时重要的是影像本身，而不仅是报告。如果您没有，影像中心可以帮您刻录到光盘或U盘。' },
  'Treatment so far': { es: 'Tratamiento hasta ahora', zh: '到目前为止的治疗' },
  'Has any of this been tried for the spine?': { es: '¿Se ha probado alguno de estos para la columna?', zh: '针对脊柱尝试过以下哪些治疗？' },
  'Which brace?': { es: '¿Qué corsé?', zh: '哪种支具？' },
  'How many hours a day was it prescribed?': { es: '¿Cuántas horas al día se indicó usarlo?', zh: '医生要求每天佩戴多少小时？' },
  'How many hours a day is it actually worn?': { es: '¿Cuántas horas al día se usa en realidad?', zh: '实际每天佩戴多少小时？' },
  'Since when?': { es: '¿Desde cuándo?', zh: '从什么时候开始？' },
  'e.g., March 2026': { es: 'p. ej., marzo de 2026', zh: '例如：2026年3月' },
  'Any problems with fit or comfort?': { es: '¿Algún problema de ajuste o comodidad?', zh: '佩戴是否合适、舒适？有什么问题吗？' },
  'e.g., rubs on the left hip': { es: 'p. ej., roza en la cadera izquierda', zh: '例如：左髋部磨' },
  'Schroth or scoliosis-specific exercises: where, for how long, and is it helping?': { es: 'Ejercicios de Schroth o específicos para escoliosis: dónde, por cuánto tiempo y si están ayudando', zh: '施罗斯或脊柱侧弯专项训练：在哪里做、做了多久、是否有帮助？' },
  'e.g., Twice a week since May; helps with the aching': { es: 'p. ej., Dos veces por semana desde mayo; ayuda con el dolor', zh: '例如：自5月起每周两次；对酸痛有帮助' },
  'Tell us what was done and when': { es: 'Cuéntenos qué se hizo y cuándo', zh: '请告诉我们做了什么、什么时候做的' },
  'e.g., Casting at 18 months, three casts': { es: 'p. ej., Yesos a los 18 meses, tres yesos', zh: '例如：18个月大时石膏矫形，共三次' },
  'Has your child been seen by another spine specialist?': { es: '¿Su hijo/a ha sido visto/a por otro especialista en columna?', zh: '孩子看过其他脊柱专科医生吗？' },
  'Who, and what were you told?': { es: '¿Quién y qué le dijeron?', zh: '是哪位医生，医生怎么说？' },
  'e.g., A surgeon at City Hospital said to watch it and return in six months': { es: 'p. ej., Un cirujano del Hospital de la Ciudad dijo que lo observáramos y volviéramos en seis meses', zh: '例如：市医院的医生说先观察，六个月后复查' },
  'If you are looking for another opinion, what would help most?': { es: 'Si busca otra opinión, ¿qué le ayudaría más?', zh: '如果您想寻求第二意见，最希望得到什么帮助？' },
  'e.g., we want to understand the options before deciding': { es: 'p. ej., queremos entender las opciones antes de decidir', zh: '例如：我们想在决定前了解各种选择' },
  'Daily life': { es: 'Vida diaria', zh: '日常生活' },
  'Has anything had to be limited or stopped?': { es: '¿Ha tenido que limitar o dejar algo?', zh: '有什么活动不得不受限或停止？' },
  'Tell us more': { es: 'Cuéntenos más', zh: '请详细说明' },
  'e.g., stopped gymnastics in April because of pain': { es: 'p. ej., dejó la gimnasia en abril por el dolor', zh: '例如：4月因疼痛停止了体操' },
  'Gym class': { es: 'Clase de educación física', zh: '体育课' },
  'How much does the appearance of the back bother your child?': { es: '¿Cuánto le molesta a su hijo/a la apariencia de la espalda?', zh: '背部的外观对孩子的困扰有多大？' },
  'A few more about the low back': { es: 'Algo más sobre la zona lumbar', zh: '关于下背部的补充问题' },
  'Does your child do any of these?': { es: '¿Su hijo/a practica alguno de estos?', zh: '孩子参加以下哪些活动？' },
  'Does arching backward bring on the pain?': { es: '¿Arquearse hacia atrás provoca el dolor?', zh: '向后弯腰会引发疼痛吗？' },
  'Getting around': { es: 'Movilidad', zh: '行动能力' },
  'Mobility': { es: 'Movilidad', zh: '活动方式' },
  'Any concerns with sitting balance?': { es: '¿Alguna preocupación con el equilibrio al sentarse?', zh: '坐位平衡有问题吗？' },
  'Any problems with seating, positioning or the wheelchair?': { es: '¿Algún problema con el asiento, la posición o la silla de ruedas?', zh: '座椅、体位或轮椅有什么问题吗？' },
  'e.g., leans to the right in the chair, pressure areas': { es: 'p. ej., se inclina a la derecha en la silla, zonas de presión', zh: '例如：坐在椅子上向右倾斜、有压疮部位' },
  'About the rounded back': { es: 'Sobre la espalda redondeada', zh: '关于驼背' },
  'When asked to stand up straight, the rounding is': { es: 'Cuando se le pide que se pare derecho/a, la curvatura es', zh: '要求挺直站立时，驼背是' },
  'Related findings': { es: 'Hallazgos relacionados', zh: '相关发现' },
  'Has anything been found in these areas?': { es: '¿Se ha encontrado algo en estas áreas?', zh: '以下方面是否发现过问题？' },
  'Early onset': { es: 'Inicio temprano', zh: '早发性' },
  'How old was your child when the curve was first noticed?': { es: '¿Qué edad tenía su hijo/a cuando se notó la curva por primera vez?', zh: '最初发现脊柱弯曲时孩子多大？' },
  'e.g., 2 years old': { es: 'p. ej., 2 años', zh: '例如：2岁' },
  'In your own words': { es: 'Con sus propias palabras', zh: '用您自己的话' },
  'Anything else about the back that you want the visit to cover?': { es: '¿Algo más sobre la espalda que quiera tratar en la consulta?', zh: '关于背部还有什么希望在就诊时讨论的？' },
  'Anything else about the recovery?': { es: '¿Algo más sobre la recuperación?', zh: '关于康复还有什么要补充的？' },
  'Write as much or as little as you like.': { es: 'Escriba tanto o tan poco como quiera.', zh: '想写多少都可以。' },
  'What has changed': { es: 'Qué ha cambiado', zh: '有哪些变化' },
  'Since the last visit, what has changed?': { es: 'Desde la última consulta, ¿qué ha cambiado?', zh: '自上次就诊以来有哪些变化？' },
  'Current treatment': { es: 'Tratamiento actual', zh: '目前的治疗' },
  'What is your child doing for the spine right now?': { es: '¿Qué está haciendo su hijo/a por la columna en este momento?', zh: '孩子目前针对脊柱在做什么治疗？' },
  'How many hours a day is the brace actually worn?': { es: '¿Cuántas horas al día se usa realmente el corsé?', zh: '支具实际每天佩戴多少小时？' },
  'Any problems with the brace?': { es: '¿Algún problema con el corsé?', zh: '支具有什么问题吗？' },
  'Anything else about the brace?': { es: '¿Algo más sobre el corsé?', zh: '关于支具还有什么要说的？' },
  'e.g., outgrown it, strap broke': { es: 'p. ej., le quedó chico, se rompió la correa', zh: '例如：已经穿不下了、绑带断了' },
  'How is the exercise program going?': { es: '¿Cómo va el programa de ejercicios?', zh: '训练计划进行得怎么样？' },
  'Does the pain wake your child from sleep now?': { es: '¿El dolor despierta ahora a su hijo/a por la noche?', zh: '现在疼痛会把孩子痛醒吗？' },
  'Imaging since the last visit': { es: 'Estudios de imagen desde la última consulta', zh: '上次就诊以来的影像检查' },
  'Any new imaging since the last visit?': { es: '¿Algún estudio de imagen nuevo desde la última consulta?', zh: '上次就诊以来有新的影像检查吗？' },
  'When and where was it done?': { es: '¿Cuándo y dónde se hizo?', zh: '什么时候、在哪里做的？' },
  'e.g., June 2026 at Valley Radiology': { es: 'p. ej., junio de 2026 en Valley Radiology', zh: '例如：2026年6月，在Valley影像中心' },
  'Growth': { es: 'Crecimiento', zh: '生长' },
  'About how much has your child grown since the last visit?': { es: '¿Aproximadamente cuánto ha crecido su hijo/a desde la última consulta?', zh: '自上次就诊以来孩子大约长高了多少？' },
  'e.g., about an inch': { es: 'p. ej., unos 2 o 3 centímetros', zh: '例如：大约2到3厘米' },
  'Has your child started having periods since the last visit?': { es: '¿Su hija ha empezado a tener la menstruación desde la última consulta?', zh: '自上次就诊以来孩子月经初潮了吗？' },
  'Recovery': { es: 'Recuperación', zh: '恢复情况' },
  'Overall, how is the recovery going?': { es: 'En general, ¿cómo va la recuperación?', zh: '总体来说恢复得怎么样？' },
  'Incision and fever': { es: 'Incisión y fiebre', zh: '切口与发热' },
  'How does the incision look?': { es: '¿Cómo se ve la incisión?', zh: '切口看起来怎么样？' },
  'Any fever over 100.4 F (38 C) since going home?': { es: '¿Alguna fiebre de más de 38 °C (100.4 °F) desde que volvió a casa?', zh: '回家后有过超过38°C（100.4°F）的发热吗？' },
  'Pain and medications': { es: 'Dolor y medicamentos', zh: '疼痛与药物' },
  'The pain is': { es: 'El dolor está', zh: '疼痛的趋势是' },
  'Which pain medications is your child using?': { es: '¿Qué analgésicos está usando su hijo/a?', zh: '孩子在用哪些止痛药？' },
  'Eating, sleeping, bowel and bladder': { es: 'Comer, dormir, intestino y vejiga', zh: '饮食、睡眠、排便和排尿' },
  'Bowel movements': { es: 'Evacuaciones', zh: '排便' },
  'Any trouble urinating?': { es: '¿Alguna dificultad para orinar?', zh: '排尿有困难吗？' },
  'Appetite': { es: 'Apetito', zh: '食欲' },
  'Sleep': { es: 'Sueño', zh: '睡眠' },
  'Nerve-related symptoms': { es: 'Síntomas relacionados con los nervios', zh: '神经相关症状' },
  'Any new trouble walking or balancing since surgery?': { es: '¿Alguna dificultad nueva para caminar o mantener el equilibrio desde la cirugía?', zh: '术后有新出现的行走或平衡困难吗？' },
  'Activity and school': { es: 'Actividad y escuela', zh: '活动与上学' },
  'Since leaving the hospital': { es: 'Desde que salió del hospital', zh: '出院以来' },
  'How does the family feel about the result so far?': { es: '¿Cómo se siente la familia con el resultado hasta ahora?', zh: '家人对目前的结果感觉如何？' },

  // ---- Diagnoses ----
  'Adolescent idiopathic scoliosis': { es: 'Escoliosis idiopática del adolescente', zh: '青少年特发性脊柱侧弯' },
  'Early-onset scoliosis (under 10)': { es: 'Escoliosis de inicio temprano (menos de 10 años)', zh: '早发性脊柱侧弯（10岁以下）' },
  'Congenital scoliosis': { es: 'Escoliosis congénita', zh: '先天性脊柱侧弯' },
  'Neuromuscular scoliosis': { es: 'Escoliosis neuromuscular', zh: '神经肌肉性脊柱侧弯' },
  'Syndromic scoliosis': { es: 'Escoliosis sindrómica', zh: '综合征性脊柱侧弯' },
  'Kyphosis': { es: 'Cifosis', zh: '后凸（驼背）' },
  'Spondylolysis or spondylolisthesis': { es: 'Espondilólisis o espondilolistesis', zh: '椎弓峡部裂或腰椎滑脱' },
  'Back pain': { es: 'Dolor de espalda', zh: '背痛' },
  'Other or not sure': { es: 'Otro o no estoy seguro/a', zh: '其他或不确定' },

  // ---- Visit goals ----
  'Understand the diagnosis': { es: 'Entender el diagnóstico', zh: '了解诊断' },
  'Discuss treatment options': { es: 'Hablar de las opciones de tratamiento', zh: '讨论治疗方案' },
  'Get a second opinion': { es: 'Obtener una segunda opinión', zh: '寻求第二意见' },
  'Evaluate for surgery': { es: 'Evaluar la cirugía', zh: '评估是否需要手术' },
  'Bracing evaluation': { es: 'Evaluación para corsé', zh: '支具评估' },
  'Pain management': { es: 'Manejo del dolor', zh: '疼痛管理' },
  'Monitor curve progression': { es: 'Vigilar la progresión de la curva', zh: '监测弯曲进展' },
  'Address cosmetic concerns': { es: 'Tratar las preocupaciones estéticas', zh: '解决外观方面的顾虑' },
  'Discuss activity or sports restrictions': { es: 'Hablar de restricciones de actividad o deportes', zh: '讨论活动或运动限制' },

  // ---- Yes / no ----
  'Not sure': { es: 'No estoy seguro/a', zh: '不确定' },

  // ---- Discovery ----
  'School screening': { es: 'Revisión escolar', zh: '学校筛查' },
  'Pediatrician check-up': { es: 'Control con el pediatra', zh: '儿科体检' },
  'A parent noticed something': { es: 'Un padre o madre notó algo', zh: '家长发现异常' },
  'The child noticed something': { es: 'El niño o la niña notó algo', zh: '孩子自己发现异常' },
  'Pain brought us in': { es: 'Vinimos por el dolor', zh: '因疼痛就诊' },
  'Seen on imaging done for another reason': { es: 'Se vio en un estudio de imagen hecho por otro motivo', zh: '因其他原因做影像检查时发现' },
  'Sports physical': { es: 'Examen físico deportivo', zh: '运动体检' },
  'Another doctor or therapist noticed': { es: 'Otro médico o terapeuta lo notó', zh: '其他医生或治疗师发现' },

  // ---- Appearance ----
  'Uneven shoulders': { es: 'Hombros desiguales', zh: '双肩不等高' },
  'Rib hump or prominence when bending forward': { es: 'Joroba o prominencia de las costillas al inclinarse hacia adelante', zh: '前弯时出现肋骨隆起' },
  'Uneven waist or hips': { es: 'Cintura o caderas desiguales', zh: '腰部或髋部不对称' },
  'Leaning or shifting to one side': { es: 'Se inclina o se desplaza hacia un lado', zh: '身体向一侧倾斜或偏移' },
  'Rounded upper back or hunch': { es: 'Espalda alta redondeada o joroba', zh: '上背部圆隆或驼背' },
  'Head carried forward': { es: 'Cabeza hacia adelante', zh: '头部前倾' },
  'Clothes fit unevenly': { es: 'La ropa queda desigual', zh: '衣服穿起来不对称' },
  'Nothing visible': { es: 'Nada visible', zh: '看不出异常' },

  // ---- Pain frequency / worse / better ----
  'Constant': { es: 'Constante', zh: '持续' },
  'Every day': { es: 'Todos los días', zh: '每天' },
  'A few times a week': { es: 'Unas cuantas veces por semana', zh: '每周几次' },
  'Occasionally': { es: 'Ocasionalmente', zh: '偶尔' },
  'Only with certain activities': { es: 'Solo con ciertas actividades', zh: '仅在某些活动时' },
  'Sitting': { es: 'Estar sentado/a', zh: '坐着' },
  'Standing': { es: 'Estar de pie', zh: '站立' },
  'Bending forward': { es: 'Inclinarse hacia adelante', zh: '向前弯腰' },
  'Bending or arching backward': { es: 'Inclinarse o arquearse hacia atrás', zh: '向后弯腰或后仰' },
  'Sports or exercise': { es: 'Deportes o ejercicio', zh: '运动或锻炼' },
  'Lifting or carrying': { es: 'Levantar o cargar', zh: '提举或搬运' },
  'Carrying a backpack': { es: 'Llevar la mochila', zh: '背书包' },
  'Lying down or at night': { es: 'Estar acostado/a o por la noche', zh: '躺下或夜间' },
  'Nothing in particular': { es: 'Nada en particular', zh: '没有特别的' },
  'Rest': { es: 'Descanso', zh: '休息' },
  'Ice or heat': { es: 'Hielo o calor', zh: '冰敷或热敷' },
  'Medication': { es: 'Medicamentos', zh: '药物' },
  'Stretching': { es: 'Estiramientos', zh: '拉伸' },
  'Changing position': { es: 'Cambiar de posición', zh: '改变姿势' },
  'Nothing helps': { es: 'Nada ayuda', zh: '什么都不管用' },
  'Have not tried anything': { es: 'No hemos probado nada', zh: '还没试过任何方法' },

  // ---- Neuro ----
  'Changes in walking or balance': { es: 'Cambios al caminar o en el equilibrio', zh: '行走或平衡改变' },
  'Fever, weight loss or night sweats': { es: 'Fiebre, pérdida de peso o sudores nocturnos', zh: '发热、体重下降或盗汗' },
  'None of these': { es: 'Ninguno de estos', zh: '以上都没有' },

  // ---- Images on hand ----
  'Yes, we have the images on a CD or USB': { es: 'Sí, tenemos las imágenes en un CD o USB', zh: '有，影像在光盘或U盘上' },
  'We only have the written report': { es: 'Solo tenemos el informe escrito', zh: '只有书面报告' },
  'No, but we can request them': { es: 'No, pero podemos solicitarlas', zh: '没有，但可以去申请' },

  // ---- Treatments ----
  'None yet': { es: 'Todavía nada', zh: '还没有' },
  'Observation and check-ups': { es: 'Observación y controles', zh: '观察和定期复查' },
  'Brace': { es: 'Corsé', zh: '支具' },
  'Schroth or scoliosis-specific exercises': { es: 'Ejercicios de Schroth o específicos para escoliosis', zh: '施罗斯或脊柱侧弯专项训练' },
  'Casting': { es: 'Yesos', zh: '石膏矫形' },
  'Surgery': { es: 'Cirugía', zh: '手术' },
  'Other': { es: 'Otro', zh: '其他' },
  'Boston brace': { es: 'Corsé de Boston', zh: '波士顿支具' },
  'Rigo-Cheneau brace': { es: 'Corsé Rigo-Cheneau', zh: 'Rigo-Cheneau 支具' },
  'Providence (night-time) brace': { es: 'Corsé Providence (nocturno)', zh: 'Providence（夜间）支具' },
  'SpineCor or soft brace': { es: 'SpineCor o corsé blando', zh: 'SpineCor 或软支具' },
  'Less than 8 hours a day': { es: 'Menos de 8 horas al día', zh: '每天少于8小时' },
  '8 to 12 hours a day': { es: 'De 8 a 12 horas al día', zh: '每天8到12小时' },
  '13 to 18 hours a day': { es: 'De 13 a 18 horas al día', zh: '每天13到18小时' },
  '19 to 23 hours a day': { es: 'De 19 a 23 horas al día', zh: '每天19到23小时' },
  'Night-time only': { es: 'Solo de noche', zh: '仅夜间' },
  'Not wearing it': { es: 'No lo usa', zh: '没有佩戴' },

  // ---- Daily life ----
  'Nothing is limited': { es: 'Nada está limitado', zh: '没有受限' },
  'Sitting in class': { es: 'Estar sentado/a en clase', zh: '课堂久坐' },
  'Walking long distances': { es: 'Caminar largas distancias', zh: '长距离行走' },
  'Full participation': { es: 'Participación completa', zh: '完全参加' },
  'Modified': { es: 'Adaptada', zh: '调整后参加' },
  'Excused': { es: 'Exento/a', zh: '免修' },
  'Not in school': { es: 'No va a la escuela', zh: '未上学' },
  'A little': { es: 'Un poco', zh: '一点' },
  'Moderately': { es: 'Moderadamente', zh: '中等' },
  'A lot': { es: 'Mucho', zh: '很大' },
  'Not at all': { es: 'Nada', zh: '完全没有' },

  // ---- Low back ----
  'Gymnastics': { es: 'Gimnasia', zh: '体操' },
  'Dance': { es: 'Danza', zh: '舞蹈' },
  'Cheerleading': { es: 'Porrismo', zh: '啦啦队' },
  'Diving': { es: 'Clavados', zh: '跳水' },
  'Football': { es: 'Fútbol americano', zh: '美式橄榄球' },
  'Wrestling': { es: 'Lucha', zh: '摔跤' },
  'Weight lifting': { es: 'Levantamiento de pesas', zh: '举重' },

  // ---- Mobility / kyphosis / associated ----
  'Walks without support': { es: 'Camina sin apoyo', zh: '无需辅助行走' },
  'Walks with a walker, crutches or braces': { es: 'Camina con andador, muletas u ortesis', zh: '借助助行器、拐杖或支具行走' },
  'Uses a wheelchair some of the time': { es: 'Usa silla de ruedas parte del tiempo', zh: '部分时间使用轮椅' },
  'Uses a wheelchair all of the time': { es: 'Usa silla de ruedas todo el tiempo', zh: '一直使用轮椅' },
  'Flexible: can straighten up when asked': { es: 'Flexible: puede enderezarse cuando se le pide', zh: '柔韧：要求时能挺直' },
  'Stiff: cannot straighten up': { es: 'Rígida: no puede enderezarse', zh: '僵硬：无法挺直' },
  'Heart': { es: 'Corazón', zh: '心脏' },
  'Kidney or urinary tract': { es: 'Riñón o vías urinarias', zh: '肾脏或泌尿系统' },
  'Spinal cord (tethered cord, syrinx, Chiari)': { es: 'Médula espinal (médula anclada, siringomielia, Chiari)', zh: '脊髓（脊髓栓系、脊髓空洞、Chiari畸形）' },
  'Hearing': { es: 'Audición', zh: '听力' },
  'None that we know of': { es: 'Ninguno que sepamos', zh: '据我们所知没有' },

  // ---- Interval ----
  'About the same': { es: 'Más o menos igual', zh: '差不多' },
  'The curve looks worse': { es: 'La curva se ve peor', zh: '弯曲看起来更严重了' },
  'The curve looks better': { es: 'La curva se ve mejor', zh: '弯曲看起来好转了' },
  'More pain': { es: 'Más dolor', zh: '疼痛加重' },
  'Less pain': { es: 'Menos dolor', zh: '疼痛减轻' },
  'New symptoms': { es: 'Síntomas nuevos', zh: '新症状' },
  'Grew noticeably': { es: 'Creció notablemente', zh: '明显长高' },
  'Started or changed a brace': { es: 'Empezó o cambió de corsé', zh: '开始使用或更换了支具' },
  'Started or stopped therapy': { es: 'Empezó o dejó la terapia', zh: '开始或停止了治疗' },
  'Had new imaging': { es: 'Se hizo estudios de imagen nuevos', zh: '做了新的影像检查' },
  'Seen another doctor for the spine': { es: 'Vio a otro médico por la columna', zh: '因脊柱看了其他医生' },
  'Observation only': { es: 'Solo observación', zh: '仅观察' },
  'Physical therapy': { es: 'Fisioterapia', zh: '物理治疗' },
  'Schroth exercises': { es: 'Ejercicios de Schroth', zh: '施罗斯训练' },
  'None': { es: 'Ninguno', zh: '没有' },
  'Skin irritation': { es: 'Irritación de la piel', zh: '皮肤刺激' },
  'Pain in the brace': { es: 'Dolor con el corsé', zh: '戴支具时疼痛' },
  'Too tight or too loose': { es: 'Demasiado apretado o demasiado flojo', zh: '太紧或太松' },
  'Hard to wear at school': { es: 'Difícil de usar en la escuela', zh: '在学校难以佩戴' },
  'Hard to wear at night': { es: 'Difícil de usar de noche', zh: '夜间难以佩戴' },
  'Sweating or heat': { es: 'Sudor o calor', zh: '出汗或闷热' },
  'Outgrown': { es: 'Le quedó chico', zh: '已经穿不下' },
  'Doing it as prescribed': { es: 'Lo hace como se indicó', zh: '按处方进行' },
  'Doing some of it': { es: 'Hace una parte', zh: '部分进行' },
  'Stopped': { es: 'Lo dejó', zh: '已停止' },
  'Not started yet': { es: 'Todavía no ha empezado', zh: '还没开始' },
  'Yes, X-ray': { es: 'Sí, radiografía', zh: '有，X光' },
  'Yes, MRI': { es: 'Sí, resonancia magnética', zh: '有，核磁共振' },
  'Yes, other imaging': { es: 'Sí, otro estudio de imagen', zh: '有，其他影像检查' },
  'Yes, since the last visit': { es: 'Sí, desde la última consulta', zh: '有，上次就诊以来' },
  'No, not yet': { es: 'No, todavía no', zh: '还没有' },
  'Had already started before the last visit': { es: 'Ya había empezado antes de la última consulta', zh: '上次就诊前已经开始' },
  'Not applicable': { es: 'No aplica', zh: '不适用' },

  // ---- Post-op ----
  'Better than expected': { es: 'Mejor de lo esperado', zh: '比预期好' },
  'About as expected': { es: 'Más o menos como se esperaba', zh: '与预期差不多' },
  'Harder than expected': { es: 'Más difícil de lo esperado', zh: '比预期艰难' },
  'Struggling': { es: 'Con dificultades', zh: '很艰难' },
  'Looks fine': { es: 'Se ve bien', zh: '看起来正常' },
  'Redness': { es: 'Enrojecimiento', zh: '发红' },
  'Swelling': { es: 'Hinchazón', zh: '肿胀' },
  'Drainage or fluid': { es: 'Secreción o líquido', zh: '渗液或流液' },
  'Opening of the incision': { es: 'Apertura de la incisión', zh: '切口裂开' },
  'Warm to the touch': { es: 'Caliente al tacto', zh: '摸起来发热' },
  'Improving each week': { es: 'Mejora cada semana', zh: '每周都在好转' },
  'Getting worse': { es: 'Empeorando', zh: '越来越重' },
  'Comes and goes': { es: 'Va y viene', zh: '时有时无' },
  'Acetaminophen': { es: 'Acetaminofén (paracetamol)', zh: '对乙酰氨基酚' },
  'Ibuprofen or naproxen': { es: 'Ibuprofeno o naproxeno', zh: '布洛芬或萘普生' },
  'Muscle relaxant': { es: 'Relajante muscular', zh: '肌肉松弛剂' },
  'Opioid (oxycodone, hydrocodone)': { es: 'Opioide (oxicodona, hidrocodona)', zh: '阿片类（羟考酮、氢可酮）' },
  'Gabapentin': { es: 'Gabapentina', zh: '加巴喷丁' },
  'Normal': { es: 'Normal', zh: '正常' },
  'Constipated': { es: 'Estreñimiento', zh: '便秘' },
  'Diarrhea': { es: 'Diarrea', zh: '腹泻' },
  'Reduced': { es: 'Reducido', zh: '减少' },
  'Poor': { es: 'Malo', zh: '差' },
  'Sleeping well': { es: 'Duerme bien', zh: '睡得好' },
  'Waking from pain': { es: 'Se despierta por el dolor', zh: '因疼痛醒来' },
  'Trouble falling asleep': { es: 'Dificultad para dormirse', zh: '入睡困难' },
  'Walking normally': { es: 'Camina normalmente', zh: '正常行走' },
  'Walking with some difficulty': { es: 'Camina con algo de dificultad', zh: '行走有些困难' },
  'Needs help walking': { es: 'Necesita ayuda para caminar', zh: '行走需要帮助' },
  'Mostly in bed': { es: 'Mayormente en cama', zh: '大多卧床' },
  'Back at school full time': { es: 'De vuelta en la escuela a tiempo completo', zh: '已全天返校' },
  'Back at school part time': { es: 'De vuelta en la escuela a tiempo parcial', zh: '已部分时间返校' },
  'Not back at school yet': { es: 'Todavía no ha vuelto a la escuela', zh: '尚未返校' },
  'Doing home exercises': { es: 'Hace ejercicios en casa', zh: '在家做锻炼' },
  'Started physical therapy': { es: 'Empezó fisioterapia', zh: '已开始物理治疗' },
  'Returned to sports': { es: 'Volvió a los deportes', zh: '已恢复运动' },
  'None of these yet': { es: 'Ninguno de estos todavía', zh: '以上都还没有' },
  'Very satisfied': { es: 'Muy satisfecho/a', zh: '非常满意' },
  'Satisfied': { es: 'Satisfecho/a', zh: '满意' },
  'Neutral': { es: 'Neutral', zh: '一般' },
  'Dissatisfied': { es: 'Insatisfecho/a', zh: '不满意' },
  'Very dissatisfied': { es: 'Muy insatisfecho/a', zh: '非常不满意' },
};

/**
 * The chip rows, drawn like the field kit's Chips and CheckChips but through
 * this step's own dictionary, so the pediatric options read in Spanish and
 * Chinese at once while the stored value stays English. `exclusive` options
 * (None, Not sure) clear the others, and vice versa.
 */
function Single({ t, label, options, value, onChange, hint }) {
  return (
    <div>
      {label && <label className="form-label">{t(label)}</label>}
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const active = value === o;
          return (
            <button
              key={o}
              type="button"
              onClick={() => onChange(active ? '' : o)}
              aria-pressed={active}
              className={`px-3.5 py-2 rounded-full text-sm border transition-colors ${
                active ? 'bg-navy-600 text-white border-navy-600' : 'bg-white text-gray-700 border-gray-200 hover:border-teal-300'
              }`}
            >
              {t(o)}
            </button>
          );
        })}
      </div>
      {hint && <p className="text-xs text-gray-400 mt-1.5">{t(hint)}</p>}
    </div>
  );
}

function Multi({ t, label, options, value = [], onChange, hint, exclusive = [], max }) {
  const toggle = (o) => {
    if (value.includes(o)) return onChange(value.filter((v) => v !== o));
    if (exclusive.includes(o)) return onChange([o]);
    const next = [...value.filter((v) => !exclusive.includes(v)), o];
    onChange(max ? next.slice(-max) : next);
  };
  return (
    <div>
      {label && <label className="form-label">{t(label)}</label>}
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const active = value.includes(o);
          return (
            <button
              key={o}
              type="button"
              onClick={() => toggle(o)}
              aria-pressed={active}
              className={`px-3.5 py-2 rounded-full text-sm border transition-colors ${
                active ? 'bg-teal-400 text-white border-teal-400' : 'bg-white text-gray-700 border-gray-200 hover:border-teal-300'
              }`}
            >
              {t(o)}
            </button>
          );
        })}
      </div>
      {hint && <p className="text-xs text-gray-400 mt-1.5">{t(hint)}</p>}
    </div>
  );
}

function Section({ title, hint, t, children }) {
  return (
    <div className="card space-y-4">
      <h3 className="text-lg font-medium text-navy-600">{t(title)}</h3>
      {hint && <p className="text-sm text-gray-500 -mt-2">{t(hint)}</p>}
      {children}
    </div>
  );
}

export default function SpineHistory({ onNext, onBack }) {
  const { data, setNested } = useIntake();
  const lang = useLang();
  const t = makeT({ ...COMMON, ...LOCAL }, lang);
  const section = pedsSectionFor(data.visit?.type);
  const answers = data.pedsSpine?.[section] || {};
  const set = (k, v) => setNested(`pedsSpine.${section}.${k}`, v);
  const female = /^f/i.test(data.demographics?.sex || '');

  // Labels and placeholders go to the field kit already translated: its own
  // translator passes a string it does not know through unchanged.
  const text = (field, label, placeholder, rows) => rows
    ? <TextArea label={t(label)} value={answers[field]} onChange={(v) => set(field, v)} placeholder={t(placeholder)} rows={rows} />
    : <TextField label={t(label)} value={answers[field]} onChange={(v) => set(field, v)} placeholder={t(placeholder)} />;

  const title = section === 'interval' ? 'Since the last visit: the spine' : section === 'postop' ? 'After surgery: how the recovery is going' : 'The spine story so far';

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h2 className="section-title">{t(title)}</h2>
        <p className="section-subtitle">{t('Tap what fits. Everything is optional, and you can add more in your own words at the end.')}</p>
      </div>

      <div className="space-y-6">
        {section === 'history' && <HistorySections t={t} a={answers} set={set} text={text} />}
        {section === 'interval' && <IntervalSections t={t} a={answers} set={set} text={text} female={female} />}
        {section === 'postop' && <PostopSections t={t} a={answers} set={set} text={text} />}
      </div>

      <StepNavigation onNext={onNext} onBack={onBack} canGoNext />
    </div>
  );
}

/** The story so far: a new patient, a new problem, or an injury with a claim. */
function HistorySections({ t, a, set, text }) {
  const dx = a.diagnosis || '';
  const tx = a.treatments || [];
  const inGroup = (group) => group.includes(dx);
  return (
    <>
      <Section title="What are you hoping for from the visit?" hint="Choose up to three." t={t}>
        <Multi t={t} options={VISIT_GOAL_OPTIONS} value={a.goals || []} onChange={(v) => set('goals', v)} max={3} />
        {text('goalOther', '', 'Something else you are hoping for (optional)')}
      </Section>

      <Section title="What have you been told so far?" hint='If a doctor has given the problem a name, choose the closest one. "Other or not sure" is a fine answer.' t={t}>
        <Single t={t} options={DIAGNOSIS_OPTIONS} value={dx} onChange={(v) => set('diagnosis', v)} />
      </Section>

      <Section title="How it started" t={t}>
        <Multi t={t} label="How was it first noticed?" options={SPINE_HISTORY.discovery} value={a.discovery || []} onChange={(v) => set('discovery', v)} exclusive={['Not sure']} />
        <Multi t={t} label="What have you noticed about the back or posture?" options={SPINE_HISTORY.appearance} value={a.appearance || []} onChange={(v) => set('appearance', v)} exclusive={['Nothing visible', 'Not sure']} />
      </Section>

      <Section title="Pain" hint="Where it hurts, how bad it is, when it started and whether it travels into the legs were covered on the symptom map and symptom details, so they are not asked again here." t={t}>
        <Single t={t} label="Does your child have back, neck or leg pain?" options={YES_NO_UNSURE} value={a.hasPain} onChange={(v) => set('hasPain', v)} />
        {a.hasPain === 'Yes' && (
          <>
            <Single t={t} label="How often?" options={SPINE_HISTORY.painFrequency} value={a.painFrequency} onChange={(v) => set('painFrequency', v)} />
            <Multi t={t} label="What makes it worse?" options={SPINE_HISTORY.painWorse} value={a.painWorse || []} onChange={(v) => set('painWorse', v)} exclusive={['Nothing in particular']} />
            <Multi t={t} label="What makes it better?" options={SPINE_HISTORY.painBetter} value={a.painBetter || []} onChange={(v) => set('painBetter', v)} exclusive={['Nothing helps', 'Have not tried anything']} />
            <Single t={t} label="Does the pain wake your child from sleep?" options={YES_NO_UNSURE} value={a.nightPain} onChange={(v) => set('nightPain', v)} />
          </>
        )}
      </Section>

      <Section title="Walking, balance and general health" t={t}>
        <Multi t={t} label="Has your child had any of these?" options={SPINE_HISTORY.neuro} value={a.neuro || []} onChange={(v) => set('neuro', v)} exclusive={['None of these']} />
      </Section>

      <Section title="Imaging and records" hint="Physical therapy, chiropractic care, injections and medicines are asked on the treatments page; imaging can be listed there and uploaded on the records page." t={t}>
        {text('curveMeasure', 'If a report gives a curve measurement, what was it?', 'e.g., 28 degrees')}
        <Single t={t} label="Do you have the actual images?" options={SPINE_HISTORY.imagesOnHand} value={a.imagesOnHand} onChange={(v) => set('imagesOnHand', v)} hint="The images themselves, not just the report, are what matter for the visit. If you do not have them, the imaging center can put them on a CD or USB for you." />
      </Section>

      <Section title="Treatment so far" t={t}>
        <Multi t={t} label="Has any of this been tried for the spine?" options={SPINE_HISTORY.treatments} value={tx} onChange={(v) => set('treatments', v)} exclusive={['None yet']} />
        {tx.includes('Brace') && (
          <>
            <Single t={t} label="Which brace?" options={SPINE_HISTORY.braceTypes} value={a.braceType} onChange={(v) => set('braceType', v)} />
            <Single t={t} label="How many hours a day was it prescribed?" options={SPINE_HISTORY.braceHours} value={a.braceHoursPrescribed} onChange={(v) => set('braceHoursPrescribed', v)} />
            <Single t={t} label="How many hours a day is it actually worn?" options={SPINE_HISTORY.braceHours} value={a.braceHoursWorn} onChange={(v) => set('braceHoursWorn', v)} />
            {text('braceSince', 'Since when?', 'e.g., March 2026')}
            {text('braceFit', 'Any problems with fit or comfort?', 'e.g., rubs on the left hip')}
          </>
        )}
        {tx.includes('Schroth or scoliosis-specific exercises') &&
          text('therapy', 'Schroth or scoliosis-specific exercises: where, for how long, and is it helping?', 'e.g., Twice a week since May; helps with the aching', 2)}
        {(tx.includes('Surgery') || tx.includes('Casting') || tx.includes('Other')) &&
          text('treatmentDetail', 'Tell us what was done and when', 'e.g., Casting at 18 months, three casts', 2)}
        <Single t={t} label="Has your child been seen by another spine specialist?" options={YES_NO_UNSURE} value={a.otherSpecialist} onChange={(v) => set('otherSpecialist', v)} />
        {a.otherSpecialist === 'Yes' && (
          <>
            {text('specialistTold', 'Who, and what were you told?', 'e.g., A surgeon at City Hospital said to watch it and return in six months', 2)}
            {text('secondOpinionWhy', 'If you are looking for another opinion, what would help most?', 'e.g., we want to understand the options before deciding', 2)}
          </>
        )}
      </Section>

      <Section title="Daily life" t={t}>
        <Multi t={t} label="Has anything had to be limited or stopped?" options={SPINE_HISTORY.limited} value={a.limited || []} onChange={(v) => set('limited', v)} exclusive={['Nothing is limited']} />
        {(a.limited || []).some((v) => v !== 'Nothing is limited') && text('limitedDetail', 'Tell us more', 'e.g., stopped gymnastics in April because of pain')}
        <Single t={t} label="Gym class" options={SPINE_HISTORY.peClass} value={a.peClass} onChange={(v) => set('peClass', v)} />
        <Single t={t} label="How much does the appearance of the back bother your child?" options={SPINE_HISTORY.appearanceBother} value={a.appearanceBother} onChange={(v) => set('appearanceBother', v)} />
      </Section>

      {inGroup(DX.lowBack) && (
        <Section title="A few more about the low back" t={t}>
          <Multi t={t} label="Does your child do any of these?" options={SPINE_HISTORY.extensionSports} value={a.extensionSports || []} onChange={(v) => set('extensionSports', v)} exclusive={['None of these']} />
          <Single t={t} label="Does arching backward bring on the pain?" options={YES_NO_UNSURE} value={a.archPain} onChange={(v) => set('archPain', v)} />
        </Section>
      )}
      {inGroup(DX.neuromuscular) && (
        <Section title="Getting around" t={t}>
          <Single t={t} label="Mobility" options={SPINE_HISTORY.mobility} value={a.mobility} onChange={(v) => set('mobility', v)} />
          <Single t={t} label="Any concerns with sitting balance?" options={YES_NO_UNSURE} value={a.sittingBalance} onChange={(v) => set('sittingBalance', v)} />
          {text('seatingIssues', 'Any problems with seating, positioning or the wheelchair?', 'e.g., leans to the right in the chair, pressure areas')}
        </Section>
      )}
      {inGroup(DX.kyphosis) && (
        <Section title="About the rounded back" t={t}>
          <Single t={t} label="When asked to stand up straight, the rounding is" options={SPINE_HISTORY.kyphosisFlex} value={a.kyphosisFlex} onChange={(v) => set('kyphosisFlex', v)} />
        </Section>
      )}
      {inGroup(DX.associated) && (
        <Section title="Related findings" t={t}>
          <Multi t={t} label="Has anything been found in these areas?" options={SPINE_HISTORY.associated} value={a.associated || []} onChange={(v) => set('associated', v)} exclusive={['None that we know of', 'Not sure']} />
        </Section>
      )}
      {inGroup(DX.eos) && (
        <Section title="Early onset" t={t}>
          {text('eosNoticedAge', 'How old was your child when the curve was first noticed?', 'e.g., 2 years old')}
        </Section>
      )}

      <Section title="In your own words" t={t}>
        {text('story', 'Anything else about the back that you want the visit to cover?', 'Write as much or as little as you like.', 4)}
      </Section>
    </>
  );
}

/** A follow-up: what the shared interval step does not ask about a growing spine. */
function IntervalSections({ t, a, set, text, female }) {
  const tx = a.currentTreatment || [];
  return (
    <>
      <Section title="What has changed" hint="The previous page covered what has changed, where it hurts now and what was tried in between. These are the questions specific to a growing spine." t={t}>
        <Multi t={t} label="Since the last visit, what has changed?" options={INTERVAL_HISTORY.sinceLast} value={a.sinceLast || []} onChange={(v) => set('sinceLast', v)} exclusive={['About the same', 'Not sure']} />
      </Section>

      <Section title="Current treatment" t={t}>
        <Multi t={t} label="What is your child doing for the spine right now?" options={INTERVAL_HISTORY.currentTreatment} value={tx} onChange={(v) => set('currentTreatment', v)} exclusive={['None']} />
        {tx.includes('Brace') && (
          <>
            <Single t={t} label="How many hours a day is the brace actually worn?" options={SPINE_HISTORY.braceHours} value={a.braceHoursWorn} onChange={(v) => set('braceHoursWorn', v)} />
            <Multi t={t} label="Any problems with the brace?" options={INTERVAL_HISTORY.braceProblems} value={a.braceProblems || []} onChange={(v) => set('braceProblems', v)} exclusive={['None']} />
            {text('braceNotes', 'Anything else about the brace?', 'e.g., outgrown it, strap broke')}
          </>
        )}
        {(tx.includes('Physical therapy') || tx.includes('Schroth exercises')) && (
          <Single t={t} label="How is the exercise program going?" options={INTERVAL_HISTORY.therapyAdherence} value={a.therapyAdherence} onChange={(v) => set('therapyAdherence', v)} />
        )}
      </Section>

      <Section title="Pain" t={t}>
        <Single t={t} label="Does the pain wake your child from sleep now?" options={YES_NO_UNSURE} value={a.nightPain} onChange={(v) => set('nightPain', v)} />
      </Section>

      <Section title="Walking, balance and general health" t={t}>
        <Multi t={t} label="Any of these since the last visit?" options={SPINE_HISTORY.neuro} value={a.neuro || []} onChange={(v) => set('neuro', v)} exclusive={['None of these']} />
      </Section>

      <Section title="Imaging since the last visit" t={t}>
        <Single t={t} label="Any new imaging since the last visit?" options={INTERVAL_HISTORY.newImaging} value={a.newImaging} onChange={(v) => set('newImaging', v)} />
        {String(a.newImaging || '').startsWith('Yes') && (
          <>
            {text('imagingWhen', 'When and where was it done?', 'e.g., June 2026 at Valley Radiology')}
            {text('curveMeasure', 'If a report gives a curve measurement, what was it?', 'e.g., 28 degrees')}
            <Single t={t} label="Do you have the actual images?" options={SPINE_HISTORY.imagesOnHand} value={a.imagesOnHand} onChange={(v) => set('imagesOnHand', v)} />
          </>
        )}
      </Section>

      <Section title="Growth" t={t}>
        {text('heightChange', 'About how much has your child grown since the last visit?', 'e.g., about an inch')}
        {female && <Single t={t} label="Has your child started having periods since the last visit?" options={INTERVAL_HISTORY.menarcheSince} value={a.menarcheSince} onChange={(v) => set('menarcheSince', v)} />}
      </Section>

      <Section title="Daily life" t={t}>
        <Multi t={t} label="Has anything had to be limited or stopped?" options={SPINE_HISTORY.limited} value={a.limited || []} onChange={(v) => set('limited', v)} exclusive={['Nothing is limited']} />
        <Single t={t} label="Gym class" options={SPINE_HISTORY.peClass} value={a.peClass} onChange={(v) => set('peClass', v)} />
        <Single t={t} label="How much does the appearance of the back bother your child?" options={SPINE_HISTORY.appearanceBother} value={a.appearanceBother} onChange={(v) => set('appearanceBother', v)} />
      </Section>

      <Section title="In your own words" t={t}>
        {text('story', 'Anything else about the back that you want the visit to cover?', 'Write as much or as little as you like.', 4)}
      </Section>
    </>
  );
}

/** After surgery: what the shared recovery step does not ask about a child. */
function PostopSections({ t, a, set, text }) {
  return (
    <>
      <Section title="Recovery" hint="The previous page covered the operation, the incision, your child's symptoms now and the medicines. These are the questions specific to a child's recovery." t={t}>
        <Single t={t} label="Overall, how is the recovery going?" options={POSTOP_HISTORY.overall} value={a.overall} onChange={(v) => set('overall', v)} />
      </Section>

      <Section title="Incision and fever" t={t}>
        <Multi t={t} label="How does the incision look?" options={POSTOP_HISTORY.incision} value={a.incision || []} onChange={(v) => set('incision', v)} exclusive={['Looks fine', 'Not sure']} />
        <Single t={t} label="Any fever over 100.4 F (38 C) since going home?" options={YES_NO_UNSURE} value={a.fever} onChange={(v) => set('fever', v)} />
      </Section>

      <Section title="Pain and medications" t={t}>
        <Single t={t} label="The pain is" options={POSTOP_HISTORY.painTrend} value={a.painTrend} onChange={(v) => set('painTrend', v)} />
        <Multi t={t} label="Which pain medications is your child using?" options={POSTOP_HISTORY.painMeds} value={a.painMeds || []} onChange={(v) => set('painMeds', v)} exclusive={['None']} />
      </Section>

      <Section title="Eating, sleeping, bowel and bladder" t={t}>
        <Single t={t} label="Bowel movements" options={POSTOP_HISTORY.bowel} value={a.bowel} onChange={(v) => set('bowel', v)} />
        <Single t={t} label="Any trouble urinating?" options={YES_NO_UNSURE} value={a.bladder} onChange={(v) => set('bladder', v)} />
        <Single t={t} label="Appetite" options={POSTOP_HISTORY.appetite} value={a.appetite} onChange={(v) => set('appetite', v)} />
        <Single t={t} label="Sleep" options={POSTOP_HISTORY.sleep} value={a.sleep} onChange={(v) => set('sleep', v)} />
      </Section>

      <Section title="Nerve-related symptoms" t={t}>
        <Single t={t} label="Any new trouble walking or balancing since surgery?" options={YES_NO_UNSURE} value={a.walkingBalance} onChange={(v) => set('walkingBalance', v)} />
      </Section>

      <Section title="Getting around" t={t}>
        <Single t={t} label="Mobility" options={POSTOP_HISTORY.mobility} value={a.mobility} onChange={(v) => set('mobility', v)} />
        <Multi t={t} label="Activity and school" options={POSTOP_HISTORY.activities} value={a.activities || []} onChange={(v) => set('activities', v)} exclusive={['None of these yet']} />
      </Section>

      <Section title="Since leaving the hospital" t={t}>
        <Single t={t} label="How does the family feel about the result so far?" options={POSTOP_HISTORY.satisfaction} value={a.satisfaction} onChange={(v) => set('satisfaction', v)} />
      </Section>

      <Section title="In your own words" t={t}>
        {text('story', 'Anything else about the recovery?', 'Write as much or as little as you like.', 4)}
      </Section>
    </>
  );
}
