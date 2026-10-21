'use client';

import { useEffect } from 'react';
import { useIntake, useService } from '../../lib/store';
import StepNavigation from '../ui/StepNavigation';
import { PainScale } from '../ui/Fields';
import HPIChat from '../HPIChat';
import { useLang, makeT, COMMON } from '../../lib/i18n';

// Display-only translations. Stored values stay canonical English.
const LOCAL = {
  // Problem labels (lib/services/spine/problems.js)
  'Neck and arm symptoms': { es: 'Síntomas de cuello y brazo', zh: '颈部和手臂症状' },
  'Mid-back symptoms': { es: 'Síntomas de la espalda media', zh: '中背部症状' },
  'Low back and leg symptoms': { es: 'Síntomas de la espalda baja y la pierna', zh: '下背部和腿部症状' },
  'Posture or curvature': { es: 'Postura o curvatura', zh: '姿势或脊柱弯曲' },
  // Problem labels (lib/services/ortho/problems.js)
  'Shoulder symptoms': { es: 'Síntomas del hombro', zh: '肩部症状' },
  'Elbow symptoms': { es: 'Síntomas del codo', zh: '肘部症状' },
  'Hand, wrist or finger symptoms': { es: 'Síntomas de la mano, la muñeca o los dedos', zh: '手、手腕或手指症状' },
  'Hip symptoms': { es: 'Síntomas de la cadera', zh: '髋部症状' },
  'Knee symptoms': { es: 'Síntomas de la rodilla', zh: '膝部症状' },
  'Ankle or foot symptoms': { es: 'Síntomas del tobillo o el pie', zh: '踝或足部症状' },
  'Neck or back symptoms': { es: 'Síntomas del cuello o la espalda', zh: '颈部或背部症状' },
  'Your symptoms': { es: 'Sus síntomas', zh: '您的症状' },
  'right': { es: 'derecho', zh: '右侧' },
  'left': { es: 'izquierdo', zh: '左侧' },
  'both sides': { es: 'ambos lados', zh: '双侧' },
  'A few quick questions about each problem. Where it hurts and where it travels comes from the body map you drew, so we will not ask that again.': {
    es: 'Unas pocas preguntas rápidas sobre cada problema. Dónde le duele y hacia dónde se extiende viene del mapa corporal que dibujó, así que no lo volveremos a preguntar.',
    zh: '关于每个问题的几个快速提问。疼痛的部位和放射范围来自您绘制的身体图，因此不会再次询问。',
  },
  'A few quick questions about each joint. Which side it is and where it travels comes from the body map you drew, so we will not ask that again.': {
    es: 'Unas pocas preguntas rápidas sobre cada articulación. De qué lado es y hacia dónde se extiende viene del mapa corporal que dibujó, así que no lo volveremos a preguntar.',
    zh: '关于每个关节的几个快速提问。哪一侧以及放射范围来自您绘制的身体图，因此不会再次询问。',
  },
  'Which problem bothers you the most?': { es: '¿Qué problema le molesta más?', zh: '哪个问题最困扰您？' },
  'Gradually, for no clear reason': { es: 'Gradualmente, sin una razón clara', zh: '逐渐出现，没有明显原因' },
  'After an injury or accident': { es: 'Después de una lesión o accidente', zh: '受伤或事故之后' },
  'After lifting or straining': { es: 'Después de levantar algo o hacer esfuerzo', zh: '搬重物或用力之后' },
  'After a fall': { es: 'Después de una caída', zh: '跌倒之后' },
  'During sport or exercise': { es: 'Durante el deporte o el ejercicio', zh: '运动或锻炼时' },
  'After a twist, slip or awkward step': { es: 'Después de una torcedura, un resbalón o un mal paso', zh: '扭伤、滑倒或踩空之后' },
  'After an accident (car, work)': { es: 'Después de un accidente (auto, trabajo)', zh: '事故之后（车祸、工伤）' },
  'After repetitive use or overuse': { es: 'Por uso repetitivo o sobrecarga', zh: '反复使用或过度使用之后' },
  'What do you think this is?': { es: '¿Qué cree que es?', zh: '您认为这是什么问题？' },
  'This only helps us ask the right questions. Your surgeon makes the diagnosis.': {
    es: 'Esto solo nos ayuda a hacer las preguntas correctas. Su cirujano hace el diagnóstico.',
    zh: '这只是帮助我们提出合适的问题。诊断由您的外科医生做出。',
  },
  'An injury (fall, twist, sport, accident)': { es: 'Una lesión (caída, torcedura, deporte, accidente)', zh: '受伤（跌倒、扭伤、运动、事故）' },
  'A broken bone': { es: 'Un hueso roto', zh: '骨折' },
  'Wear and tear or arthritis': { es: 'Desgaste o artritis', zh: '磨损或关节炎' },
  'A long-standing problem that has worsened': { es: 'Un problema de larga data que ha empeorado', zh: '长期存在且加重的问题' },
  'Over time, has this been...': { es: 'Con el tiempo, esto ha estado...', zh: '随着时间推移，这个问题一直是……' },
  'About the same': { es: 'Más o menos igual', zh: '大致相同' },
  'How bad is it on a typical day? (0 to 10)': { es: '¿Qué tan fuerte es en un día típico? (0 a 10)', zh: '通常一天的疼痛程度如何？（0 到 10）' },
  'How would you describe it? (optional, tap all that apply)': { es: '¿Cómo lo describiría? (opcional, toque todos los que apliquen)', zh: '您会如何描述它？（可选，点选所有适用项）' },
  'Does the joint do any of these? (tap all that apply)': { es: '¿La articulación hace algo de esto? (toque todo lo que aplique)', zh: '关节有以下情况吗？（点选所有适用项）' },
  'Swelling': { es: 'Hinchazón', zh: '肿胀' },
  'Stiffness, worst in the morning or after sitting': { es: 'Rigidez, peor por la mañana o después de estar sentado', zh: '僵硬，早晨或久坐后最明显' },
  'Locking or catching': { es: 'Se traba o se engancha', zh: '卡住或交锁' },
  'Giving way or feeling unstable': { es: 'Se dobla o se siente inestable', zh: '打软或感觉不稳' },
  'Clicking, popping or grinding': { es: 'Chasquidos, crujidos o rechinar', zh: '弹响、咔哒声或摩擦感' },
  'Loss of motion': { es: 'Pérdida de movimiento', zh: '活动范围减少' },
  'A visible bump or change in shape': { es: 'Un bulto visible o un cambio de forma', zh: '可见的隆起或形状改变' },
  'Pain at night': { es: 'Dolor por la noche', zh: '夜间疼痛' },
  'None of these': { es: 'Ninguno de estos', zh: '以上都没有' },
  'About the injury': { es: 'Sobre la lesión', zh: '关于受伤' },
  'When did the injury happen?': { es: '¿Cuándo ocurrió la lesión?', zh: '受伤是什么时候发生的？' },
  'e.g., March 3, or about 2 weeks ago': { es: 'p. ej., 3 de marzo, o hace unas 2 semanas', zh: '例如：3月3日，或大约两周前' },
  'Can you put weight on it or use it?': { es: '¿Puede apoyar peso o usarlo?', zh: '能承重或使用它吗？' },
  'Yes, normally': { es: 'Sí, con normalidad', zh: '可以，正常' },
  'Yes, but it hurts': { es: 'Sí, pero duele', zh: '可以，但疼' },
  'Only with a limp or support': { es: 'Solo cojeando o con apoyo', zh: '只能跛行或借助支撑' },
  'Are you in any of these right now?': { es: '¿Lleva alguno de estos ahora?', zh: '您目前使用以下哪些？' },
  'None': { es: 'Ninguno', zh: '无' },
  'Cast': { es: 'Yeso', zh: '石膏' },
  'Splint or brace': { es: 'Férula u ortesis', zh: '夹板或支具' },
  'Walking boot': { es: 'Bota ortopédica', zh: '步行靴' },
  'Sling': { es: 'Cabestrillo', zh: '吊带' },
  'Crutches or a walker': { es: 'Muletas o andador', zh: '拐杖或助行器' },
  'Where were you seen, and were X-rays taken?': { es: '¿Dónde lo atendieron y le hicieron radiografías?', zh: '您在哪里就诊过？拍过X光吗？' },
  'e.g., The emergency room on the day, X-ray showed a broken wrist; or not seen yet': { es: 'p. ej., Urgencias ese día, la radiografía mostró una muñeca rota; o aún no me han visto', zh: '例如：当天在急诊，X光显示手腕骨折；或尚未就诊' },
  'Safety check': { es: 'Revisión de seguridad', zh: '安全检查' },
  'A few yes/no questions that matter for your care. Please answer each one.': {
    es: 'Unas pocas preguntas de sí/no que importan para su atención. Por favor responda cada una.',
    zh: '几个对您的诊疗很重要的是/否问题。请逐一回答。',
  },
  'Numbness anywhere?': { es: '¿Entumecimiento en alguna parte?', zh: '身体任何部位麻木？' },
  'Weakness in an arm or leg?': { es: '¿Debilidad en un brazo o una pierna?', zh: '手臂或腿部无力？' },
  'Any new trouble controlling your bladder or bowels?': { es: '¿Algún problema nuevo para controlar la vejiga o el intestino?', zh: '新出现的大小便控制困难？' },
  'Is the joint hot, red and swollen, or do you have a fever with it?': { es: '¿La articulación está caliente, roja e hinchada, o tiene fiebre con ella?', zh: '关节发热、发红、肿胀，或伴有发烧？' },
  'Any open wound or broken skin over the injured area?': { es: '¿Alguna herida abierta o piel rota sobre la zona lesionada?', zh: '受伤部位有开放性伤口或皮肤破损？' },
  'Is the hand or foot beyond the injury cold, pale or numb?': { es: '¿La mano o el pie más allá de la lesión está frío, pálido o entumecido?', zh: '受伤部位远端的手或脚发冷、苍白或麻木？' },
  'Severe pain getting rapidly worse, with tight swelling?': { es: '¿Dolor intenso que empeora rápidamente, con hinchazón tensa?', zh: '剧烈疼痛迅速加重，伴有紧绷的肿胀？' },
  'Especially inside a cast or splint': { es: 'Especialmente dentro de un yeso o una férula', zh: '尤其是在石膏或夹板内' },
  'Calf swelling or pain, or sudden shortness of breath?': { es: '¿Hinchazón o dolor en la pantorrilla, o falta de aire repentina?', zh: '小腿肿胀或疼痛，或突然气短？' },
  'Do numb fingers wake you at night or make you shake your hand out?': { es: '¿Los dedos entumecidos lo despiertan por la noche o lo hacen sacudir la mano?', zh: '手指麻木会让您夜里醒来或需要甩手？' },
  'Does a finger catch or lock when you bend it?': { es: '¿Algún dedo se traba o se bloquea al doblarlo?', zh: '弯曲手指时会卡住或锁住？' },
  'Which hand do you write with?': { es: '¿Con qué mano escribe?', zh: '您用哪只手写字？' },
  'Right-handed': { es: 'Diestro', zh: '右利手' },
  'Left-handed': { es: 'Zurdo', zh: '左利手' },
  'Pain lying on that shoulder at night?': { es: '¿Dolor al acostarse sobre ese hombro por la noche?', zh: '夜里侧卧压到那侧肩膀会疼？' },
  'Has the shoulder ever popped out (dislocated)?': { es: '¿Alguna vez se le ha salido el hombro (luxación)?', zh: '肩膀曾经脱臼过吗？' },
  'Trouble lifting the arm overhead?': { es: '¿Dificultad para levantar el brazo por encima de la cabeza?', zh: '手臂抬过头顶有困难？' },
  'Pain in the groin, or trouble putting on socks and shoes?': { es: '¿Dolor en la ingle, o dificultad para ponerse calcetines y zapatos?', zh: '腹股沟疼痛，或穿袜子穿鞋有困难？' },
  'Did you hear or feel a pop when it was injured?': { es: '¿Escuchó o sintió un chasquido al lesionarse?', zh: '受伤时听到或感觉到"啪"的一声？' },
  'Did it swell within a few hours of the injury?': { es: '¿Se hinchó en las primeras horas tras la lesión?', zh: '受伤后几小时内就肿了？' },
  'Repeated ankle sprains or rolling over on uneven ground?': { es: '¿Esguinces de tobillo repetidos o se le dobla en terreno irregular?', zh: '反复扭伤脚踝，或在不平的地面上容易崴脚？' },
  'Numbness in the groin or inner thighs?': { es: '¿Entumecimiento en la ingle o la cara interna de los muslos?', zh: '腹股沟或大腿内侧麻木？' },
  'Foot slapping or catching on stairs?': { es: '¿El pie se arrastra o se traba en las escaleras?', zh: '上楼梯时脚拖地或绊到？' },
  'Trouble with buttons, writing or small objects?': { es: '¿Dificultad con botones, escritura u objetos pequeños?', zh: '扣扣子、写字或拿小物件有困难？' },
  'Dropping things more than usual?': { es: '¿Se le caen las cosas más de lo habitual?', zh: '比平时更容易掉东西？' },
  'Unsteady on your feet?': { es: '¿Inestable al caminar?', zh: '站立或行走不稳？' },
  'Electric shock down your spine when you bend your neck?': { es: '¿Sensación de descarga eléctrica por la columna al doblar el cuello?', zh: '低头时脊柱有触电感？' },
  'Prefer to talk it through?': { es: '¿Prefiere contarlo en una conversación?', zh: '更想通过对话来讲述？' },
  'Tell it in your own words': { es: 'Cuéntelo con sus propias palabras', zh: '用您自己的话讲述' },
  'Optional. A short back-and-forth: our assistant asks about five questions and you answer however you like.': {
    es: 'Opcional. Una conversación corta: nuestro asistente hace unas cinco preguntas y usted responde como quiera.',
    zh: '可选。简短的问答：我们的助手会问大约五个问题，您可以随意作答。',
  },
  'Prefer quick questions instead?': { es: '¿Prefiere las preguntas rápidas?', zh: '更想回答快速问题？' },
  'Switch': { es: 'Cambiar', zh: '切换' },
  // The "anything else?" box (formerly its own step)
  'Anything else you want the team to know?': { es: '¿Algo más que quiera que el equipo sepa?', zh: '还有什么想让团队知道的吗？' },
  'Optional. Your goals for the visit, questions you have, or anything the questions above missed.': {
    es: 'Opcional. Sus objetivos para la consulta, sus preguntas o cualquier cosa que las preguntas anteriores no hayan cubierto.',
    zh: '可选。您的就诊目标、疑问，或上面的问题没有涵盖的内容。',
  },
  "For example: I'm most worried about the numbness in my hand, and I'd like to understand my options before considering surgery...": {
    es: 'Por ejemplo: Lo que más me preocupa es el entumecimiento en la mano, y me gustaría entender mis opciones antes de considerar una cirugía...',
    zh: '例如：我最担心手部的麻木，希望在考虑手术之前先了解我的选择……',
  },
  // Section header
  'Symptom Details': { es: 'Detalles de los síntomas', zh: '症状详情' },
  "Let's go through the symptoms you told us about. You can fill this out for all of your symptoms on this one page — answer what you can and skip anything that doesn't apply.":
    { es: 'Repasemos los síntomas que nos indicó. Puede completar esto para todos sus síntomas en esta misma página: responda lo que pueda y omita lo que no corresponda.', zh: '让我们回顾您告诉我们的症状。您可以在同一页面上填写所有症状——尽量回答，遇到不适用的可以跳过。' },

  // Bothers most
  'Which symptom bothers you the most?': { es: '¿Qué síntoma le molesta más?', zh: '哪种症状最困扰您？' },
  'This helps your surgeon focus on what matters most to you.': { es: 'Esto ayuda a su cirujano a concentrarse en lo que más le importa.', zh: '这有助于您的外科医生关注对您最重要的问题。' },
  'Bothers me most': { es: 'Lo que más me molesta', zh: '最困扰我' },

  // Empty state
  'No symptom areas were selected yet. Please go back and choose where you have symptoms.':
    { es: 'Aún no se seleccionaron áreas de síntomas. Vuelva atrás y elija dónde tiene síntomas.', zh: '尚未选择任何症状部位。请返回并选择您有症状的部位。' },
  'No joints were selected yet. Please go back and choose where you have symptoms.':
    { es: 'Aún no se seleccionaron articulaciones. Vuelva atrás y elija dónde tiene síntomas.', zh: '尚未选择任何关节。请返回并选择您有症状的部位。' },
  'Go Back': { es: 'Volver', zh: '返回' },

  // Nav
  'Continue to Prior Treatments': { es: 'Continuar a tratamientos previos', zh: '继续到既往治疗' },

  // Shared section headings
  'A Few Questions About Your Symptoms Overall': { es: 'Algunas preguntas sobre sus síntomas en general', zh: '关于您整体症状的几个问题' },
  'These apply to all of the symptoms above — you only need to answer them once.':
    { es: 'Estas aplican a todos los síntomas anteriores: solo debe responderlas una vez.', zh: '这些问题适用于上述所有症状——您只需回答一次。' },
  'Associated Symptoms': { es: 'Síntomas asociados', zh: '相关症状' },
  'Neck & Upper Body': { es: 'Cuello y parte superior del cuerpo', zh: '颈部与上半身' },
  'A few specific questions related to your neck/arm symptoms.': { es: 'Algunas preguntas específicas relacionadas con sus síntomas de cuello/brazo.', zh: '一些与您颈部/手臂症状相关的具体问题。' },
  'Lower Body': { es: 'Parte inferior del cuerpo', zh: '下半身' },
  'A few specific questions related to your back/leg symptoms.': { es: 'Algunas preguntas específicas relacionadas con sus síntomas de espalda/pierna.', zh: '一些与您背部/腿部症状相关的具体问题。' },
  'Impact on Daily Life': { es: 'Impacto en la vida diaria', zh: '对日常生活的影响' },

  // Aggravating / relieving
  'What makes your symptoms worse? (select all that apply)': { es: '¿Qué empeora sus síntomas? (seleccione todo lo que corresponda)', zh: '什么会加重您的症状？（选择所有适用项）' },
  'What makes your symptoms better? (select all that apply)': { es: '¿Qué mejora sus síntomas? (seleccione todo lo que corresponda)', zh: '什么会改善您的症状？（选择所有适用项）' },
  // aggravating options
  'Sitting': { es: 'Estar sentado', zh: '坐着' },
  'Standing': { es: 'Estar de pie', zh: '站立' },
  'Walking': { es: 'Caminar', zh: '行走' },
  'Bending forward': { es: 'Inclinarse hacia adelante', zh: '向前弯腰' },
  'Bending backward': { es: 'Inclinarse hacia atrás', zh: '向后弯腰' },
  'Twisting': { es: 'Girar el torso', zh: '扭转身体' },
  'Lifting': { es: 'Levantar peso', zh: '提举重物' },
  'Coughing/sneezing': { es: 'Toser/estornudar', zh: '咳嗽/打喷嚏' },
  'Lying down': { es: 'Acostarse', zh: '躺下' },
  'Getting up from a chair': { es: 'Levantarse de una silla', zh: '从椅子上起身' },
  'Driving': { es: 'Conducir', zh: '开车' },
  'Exercise': { es: 'Hacer ejercicio', zh: '运动' },
  'Stairs': { es: 'Subir escaleras', zh: '上下楼梯' },
  // relieving options
  'Rest': { es: 'Descansar', zh: '休息' },
  'Leaning forward': { es: 'Inclinarse hacia adelante', zh: '身体前倾' },
  'Ice': { es: 'Hielo', zh: '冰敷' },
  'Heat': { es: 'Calor', zh: '热敷' },
  'Medication': { es: 'Medicamentos', zh: '药物' },
  'Stretching': { es: 'Estiramientos', zh: '拉伸' },
  'Position changes': { es: 'Cambios de posición', zh: '改变姿势' },
  'Nothing helps': { es: 'Nada ayuda', zh: '什么都没用' },

  // Associated symptoms
  'Numbness?': { es: '¿Entumecimiento?', zh: '麻木？' },
  'Loss of sensation or feeling': { es: 'Pérdida de sensibilidad', zh: '感觉丧失' },
  'Tingling or pins-and-needles?': { es: '¿Hormigueo o sensación de pinchazos?', zh: '刺痛或针刺感？' },
  'Weakness?': { es: '¿Debilidad?', zh: '无力？' },
  'Difficulty moving or muscle feels weak': { es: 'Dificultad para mover o sensación de músculo débil', zh: '活动困难或肌肉感觉无力' },
  'Does it disrupt your sleep?': { es: '¿Le altera el sueño?', zh: '会干扰您的睡眠吗？' },

  // Cervical screening
  'Trouble with buttons, writing, or small objects?': { es: '¿Dificultad con botones, escribir u objetos pequeños?', zh: '扣纽扣、书写或抓小物件有困难吗？' },
  'Fine motor difficulty': { es: 'Dificultad con la motricidad fina', zh: '精细动作困难' },
  'Dropping objects more than usual?': { es: '¿Deja caer objetos más de lo habitual?', zh: '比平时更容易掉落物品吗？' },
  'Balance or coordination problems?': { es: '¿Problemas de equilibrio o coordinación?', zh: '有平衡或协调问题吗？' },
  'Electric shock feeling with neck movement?': { es: '¿Sensación de descarga eléctrica al mover el cuello?', zh: '活动颈部时有触电般的感觉吗？' },
  'Sensation down your spine when bending the neck': { es: 'Sensación que baja por la columna al doblar el cuello', zh: '低头时脊柱有一股感觉向下传' },

  // Lumbar screening
  'Pain below the knee?': { es: '¿Dolor por debajo de la rodilla?', zh: '膝盖以下疼痛吗？' },
  'Symptoms improve when you sit or lean forward?': { es: '¿Mejoran los síntomas al sentarse o inclinarse hacia adelante?', zh: '坐下或身体前倾时症状会缓解吗？' },
  'Difficulty with stairs or foot feels floppy?': { es: '¿Dificultad con las escaleras o el pie se siente flojo?', zh: '上下楼梯困难或脚感觉无力下垂吗？' },
  'Foot drop or leg weakness': { es: 'Pie caído o debilidad en la pierna', zh: '足下垂或腿部无力' },
  'Changes in bowel or bladder control?': { es: '¿Cambios en el control intestinal o de la vejiga?', zh: '大小便控制有变化吗？' },
  'New incontinence or difficulty with urination': { es: 'Nueva incontinencia o dificultad para orinar', zh: '新出现的失禁或排尿困难' },
  'Numbness in the groin or inner thigh area?': { es: '¿Entumecimiento en la ingle o la cara interna del muslo?', zh: '腹股沟或大腿内侧麻木吗？' },
  'How far can you walk before needing to stop?': { es: '¿Qué distancia puede caminar antes de tener que detenerse?', zh: '您能走多远才需要停下来？' },
  // walking tolerance options
  'Unlimited': { es: 'Sin límite', zh: '不受限' },
  'More than 30 minutes': { es: 'Más de 30 minutos', zh: '超过30分钟' },
  '15-30 minutes': { es: '15 a 30 minutos', zh: '15至30分钟' },
  '5-15 minutes': { es: '5 a 15 minutos', zh: '5至15分钟' },
  'Less than 5 minutes': { es: 'Menos de 5 minutos', zh: '少于5分钟' },
  'Less than 1 block': { es: 'Menos de una cuadra', zh: '不到一个街区' },
  'Need a wheelchair/scooter': { es: 'Necesito silla de ruedas/scooter', zh: '需要轮椅/代步车' },

  // Functional impact selects
  'Impact on work': { es: 'Impacto en el trabajo', zh: '对工作的影响' },
  'No impact': { es: 'Sin impacto', zh: '没有影响' },
  'Mild — can still work': { es: 'Leve: aún puedo trabajar', zh: '轻度——仍能工作' },
  'Moderate — work is difficult': { es: 'Moderado: el trabajo es difícil', zh: '中度——工作困难' },
  'Severe — missing work': { es: 'Grave: falto al trabajo', zh: '重度——请假误工' },
  'Unable to work': { es: 'Incapaz de trabajar', zh: '无法工作' },
  'Retired/Not working': { es: 'Jubilado/Sin trabajar', zh: '已退休/未工作' },
  'Impact on exercise/activities': { es: 'Impacto en el ejercicio/actividades', zh: '对运动/活动的影响' },
  'Mild limitation': { es: 'Limitación leve', zh: '轻度受限' },
  'Moderate limitation': { es: 'Limitación moderada', zh: '中度受限' },
  'Severe limitation': { es: 'Limitación grave', zh: '重度受限' },
  'Unable to exercise': { es: 'Incapaz de hacer ejercicio', zh: '无法运动' },
  'How long can you sit comfortably?': { es: '¿Cuánto tiempo puede estar sentado cómodamente?', zh: '您能舒适地坐多久？' },
  'No limitation': { es: 'Sin limitación', zh: '不受限' },
  'More than 1 hour': { es: 'Más de 1 hora', zh: '超过1小时' },
  '30-60 minutes': { es: '30 a 60 minutos', zh: '30至60分钟' },
  'Less than 15 minutes': { es: 'Menos de 15 minutos', zh: '少于15分钟' },
  'How long can you stand comfortably?': { es: '¿Cuánto tiempo puede estar de pie cómodamente?', zh: '您能舒适地站多久？' },

  // Per-card labels
  'When did this start?': { es: '¿Cuándo comenzó esto?', zh: '这是什么时候开始的？' },
  'e.g., About 6 months ago, After a fall in March 2024': { es: 'p. ej., Hace unos 6 meses, Después de una caída en marzo de 2024', zh: '例如：大约6个月前，2024年3月摔倒之后' },
  'How did it start?': { es: '¿Cómo comenzó?', zh: '它是如何开始的？' },
  'Gradually over time': { es: 'Gradualmente con el tiempo', zh: '随时间逐渐出现' },
  'Suddenly': { es: 'De repente', zh: '突然出现' },
  'After an injury': { es: 'Después de una lesión', zh: '受伤之后' },
  'After surgery': { es: 'Después de una cirugía', zh: '手术之后' },
  "I'm not sure": { es: 'No estoy seguro', zh: '我不确定' },
  'Over time, has this symptom been...': { es: 'Con el tiempo, este síntoma ha estado...', zh: '随着时间推移，这个症状一直是……' },
  'Getting worse': { es: 'Empeorando', zh: '逐渐加重' },
  'Staying about the same': { es: 'Manteniéndose más o menos igual', zh: '大致保持不变' },
  'Getting better': { es: 'Mejorando', zh: '逐渐好转' },
  'Comes and goes': { es: 'Va y viene', zh: '时有时无' },
  'Which side?': { es: '¿Qué lado?', zh: '哪一侧？' },
  'Right': { es: 'Derecho', zh: '右侧' },
  'Left': { es: 'Izquierdo', zh: '左侧' },
  'Both sides': { es: 'Ambos lados', zh: '两侧' },
  'Midline/center': { es: 'Línea media/centro', zh: '中线/中央' },
  'Varies': { es: 'Varía', zh: '不定' },
  'How severe is it? (0 = none, 10 = worst imaginable):': { es: '¿Qué tan intenso es? (0 = ninguno, 10 = el peor imaginable):', zh: '有多严重？（0 = 无，10 = 无法想象的剧烈）：' },
  '0 — None': { es: '0 — Ninguno', zh: '0 — 无' },
  '5 — Moderate': { es: '5 — Moderado', zh: '5 — 中等' },
  '10 — Worst': { es: '10 — El peor', zh: '10 — 最剧烈' },
  'How would you describe it? (select all that apply)': { es: '¿Cómo lo describiría? (seleccione todo lo que corresponda)', zh: '您会如何描述它？（选择所有适用项）' },
  'Does it travel or spread to other areas?': { es: '¿Se traslada o se extiende a otras áreas?', zh: '它会传导或扩散到其他部位吗？' },
  'Where does it travel to? e.g., Down my left leg to the foot': { es: '¿A dónde se traslada? p. ej., Baja por mi pierna izquierda hasta el pie', zh: '它传导到哪里？例如：沿我的左腿向下到脚' },

  // PAIN_QUALITIES (the service's constants module) — translate here for display
  'Aching': { es: 'Adolorido', zh: '酸痛' },
  'Sharp': { es: 'Agudo', zh: '刺痛' },
  'Burning': { es: 'Ardiente', zh: '灼痛' },
  'Stabbing': { es: 'Como puñalada', zh: '如刀刺' },
  'Cramping': { es: 'Con calambres', zh: '痉挛性痛' },
  'Electric/shooting': { es: 'Como descarga eléctrica/punzante', zh: '电击样/放射痛' },
  'Throbbing': { es: 'Pulsátil', zh: '搏动性痛' },
  'Pressure': { es: 'Presión', zh: '压迫感' },
  'Dull': { es: 'Sordo', zh: '钝痛' },
  'Stiffness': { es: 'Rigidez', zh: '僵硬' },
};

/**
 * Symptom Details — consolidated structured symptom collection.
 *
 * Instead of forcing the patient to fill out an entire page of questions for
 * EACH symptom region, this step is completed all at once:
 *   - One card per problem asks only what genuinely varies by problem
 *     (onset, how it started, the trend, severity, quality). For a joint
 *     (the ortho service) the card also asks what the patient thinks it is,
 *     the mechanical symptoms, and for an injury the date, weight bearing and
 *     any cast or splint.
 *   - The safety questions are asked a single time; which ones appear comes
 *     from the service's SAFETY_QUESTIONS (the myelopathy and cauda equina
 *     screens for the spine; the infection, circulation, clot and
 *     joint-specific screens for a bone or joint). The review-of-systems
 *     step copies these answers (rosSystems SAFETY_TO_ROS) and does not ask
 *     them again.
 *   - The structured questions are the default. A short guided conversation
 *     is offered as an option, never as a gate: nothing here blocks Continue.
 *   - A problem that began with an injury (the chief complaint's injury chip,
 *     or a work or accident claim) starts with "how it started" pre-answered
 *     (the service's injuryDefaults); the patient can change it.
 *   - The "anything else?" box that used to be its own step is at the end.
 *
 * Everything that differs by service is read from `useService().problems`.
 */
export default function SymptomDetails({ onNext, onBack }) {
  const { data, setNested } = useIntake();
  const svc = useService();
  const defs = svc.problems;
  const { SYMPTOM_DETAILS_TEXT: text } = defs;
  const lang = useLang();
  const t = makeT({ ...COMMON, ...LOCAL }, lang);
  const hpi = data.hpiData;
  const selectedRegions = data.chiefComplaint.symptomRegions || [];

  const overall = hpi.overall || {};
  const updateOverall = (field, value) => setNested(`hpiData.overall.${field}`, value);

  // The areas the patient tapped, folded into the problems they belong to.
  const problems = defs.problemsFor(selectedRegions);
  const kinds = Object.values(hpi.problems || {}).map((p) => p?.kind);
  const anyInjury = kinds.some(defs.isInjuryKind) || selectedRegions.includes('trauma');
  const safetyContext = { problems: new Set(problems.map((p) => p.id)), anyInjury };
  const primary = hpi.primaryProblem || (problems.length === 1 ? problems[0].id : '');

  // The structured questions unless the patient chose the conversation. The
  // choice is kept so coming back shows the same.
  const mode = hpi.detailMode === 'conversation' ? 'conversation' : 'questions';
  const setMode = (m) => setNested('hpiData.detailMode', m);

  // An injury already told to us: the chief complaint's injury chip, or a
  // claim. A problem the patient has not touched yet starts from the
  // service's injury defaults; once its record exists it is never re-seeded.
  const trauma = selectedRegions.includes('trauma');
  const claim = ['workers_comp', 'personal_injury'].includes(data.visit?.type) || (!!data.visit?.workInjury && data.visit.workInjury !== 'No');
  const problemKey = problems.map((p) => p.id).join(',');
  useEffect(() => {
    if (!(trauma || claim) || !defs.injuryDefaults) return;
    const patch = defs.injuryDefaults({ trauma, claim });
    for (const p of problems) {
      if (hpi.problems?.[p.id]) continue;
      for (const [k, v] of Object.entries(patch)) setNested(`hpiData.problems.${p.id}.${k}`, v);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trauma, claim, problemKey]);

  const safety = (
    <SafetyCheck t={t} overall={overall} update={updateOverall} questions={defs.SAFETY_QUESTIONS} context={safetyContext} />
  );

  // Formerly its own step; the same field, so the note and the office read it as before.
  const anythingElse = (
    <div className="card mt-4">
      <label className="form-label text-base">{t('Anything else you want the team to know?')}</label>
      <p className="text-sm text-gray-400 mb-3">{t('Optional. Your goals for the visit, questions you have, or anything the questions above missed.')}</p>
      <textarea
        value={hpi.additionalConcerns || ''}
        onChange={(e) => setNested('hpiData.additionalConcerns', e.target.value)}
        placeholder={t("For example: I'm most worried about the numbness in my hand, and I'd like to understand my options before considering surgery...")}
        rows={3}
        className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-800 resize-none"
      />
    </div>
  );

  if (selectedRegions.length > 0 && mode === 'conversation') {
    return (
      <div className="animate-fade-in">
        <div className="mb-6">
          <h2 className="section-title">{t('Symptom Details')}</h2>
          <p className="section-subtitle">
            {t('Optional. A short back-and-forth: our assistant asks about five questions and you answer however you like.')}{' '}
            {t('Prefer quick questions instead?')}{' '}
            <button type="button" onClick={() => setMode('questions')} className="text-teal-600 hover:underline font-medium">{t('Switch')}</button>
          </p>
        </div>
        <HPIChat intakeData={data} hpiData={hpi} setNested={setNested} maxTurns={5} autoStart />
        {safety}
        {anythingElse}
        <StepNavigation onNext={onNext} onBack={onBack} canGoNext nextLabel={t('Continue')} />
      </div>
    );
  }

  if (selectedRegions.length === 0) {
    return (
      <div className="animate-fade-in">
        <div className="card text-center py-12">
          <p className="text-gray-500 mb-4">
            {t(text.empty)}
          </p>
          <button onClick={onBack} className="btn-secondary">{t('Go Back')}</button>
        </div>
        <StepNavigation onNext={onNext} onBack={onBack} canGoNext nextLabel={t('Continue')} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h2 className="section-title">{t('Symptom Details')}</h2>
        <p className="section-subtitle">{t(text.intro)}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-gray-500">
          <span>{t('Prefer to talk it through?')}</span>
          <button type="button" onClick={() => setMode('conversation')} className="btn-secondary text-sm py-1.5 px-3">
            {t('Tell it in your own words')}
          </button>
        </div>
      </div>

      {problems.length > 1 && (
        <div className="card mb-4">
          <label className="form-label text-base">{t('Which problem bothers you the most?')}</label>
          <div className="flex flex-wrap gap-2">
            {problems.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setNested('hpiData.primaryProblem', p.id)}
                className={`chip ${primary === p.id ? 'chip-selected' : 'chip-unselected'}`}
              >
                {t(p.label)}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {problems.map((p) => (
          <ProblemCard
            key={p.id}
            t={t}
            defs={defs}
            painQualities={svc.constants.PAIN_QUALITIES}
            problem={p}
            single={problems.length === 1}
            isPrimary={problems.length > 1 && primary === p.id}
            value={hpi.problems?.[p.id] || {}}
            duration={data.chiefComplaint.duration}
            update={(field, v) => setNested(`hpiData.problems.${p.id}.${field}`, v)}
          />
        ))}
      </div>

      {safety}
      {anythingElse}

      <StepNavigation onNext={onNext} onBack={onBack} canGoNext nextLabel={t('Continue')} />
    </div>
  );
}


// ===========================================================================
// One problem: when, how it started, the trend, how bad, what it feels like.
// For a joint (the ortho service's option lists are non-empty): also what the
// patient thinks it is, what the joint does, and for an injury the date,
// weight bearing and any cast or splint. When it started is asked here, once
// per problem (an older draft that answered the chief-complaint step's
// retired duration chips is not asked again for a single problem).
// ===========================================================================
function ProblemCard({ t, defs, painQualities, problem, value, update, single, isPrimary, duration }) {
  const {
    sidesFor, isInjuryKind, ONSET_OPTIONS, ONSET_TYPE_OPTIONS, PROGRESSION_OPTIONS,
    PROBLEM_KIND_OPTIONS, MECHANICAL_OPTIONS, WEIGHT_BEARING_OPTIONS, IMMOBILIZATION_OPTIONS, SYMPTOM_DETAILS_TEXT: text,
  } = defs;
  const side = sidesFor(problem);
  const injury = isInjuryKind(value.kind);
  const asksMechanical = MECHANICAL_OPTIONS.length > 0 && problem.mechanical !== false;
  const mech = value.mechanical || [];
  const toggleMech = (opt) => {
    if (opt === 'None of these') return update('mechanical', mech.includes(opt) ? [] : ['None of these']);
    const next = mech.filter((x) => x !== 'None of these');
    update('mechanical', next.includes(opt) ? next.filter((x) => x !== opt) : [...next, opt]);
  };
  return (
    <div className={`card space-y-5 ${isPrimary ? 'ring-2 ring-teal-300' : ''}`}>
      <div className="flex items-center gap-2 flex-wrap">
        <h3 className="text-lg font-semibold text-navy-600">{t(problem.label)}</h3>
        {side && <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{t(side)}</span>}
        {isPrimary && (
          <span className="text-xs font-medium text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">{t('Bothers me most')}</span>
        )}
      </div>
      {PROBLEM_KIND_OPTIONS.length > 0 && (
        <div>
          <ChipRow t={t} label={t('What do you think this is?')} value={value.kind} onChange={(v) => update('kind', v)} options={PROBLEM_KIND_OPTIONS} />
          <p className="text-xs text-gray-400 mt-1">{t('This only helps us ask the right questions. Your surgeon makes the diagnosis.')}</p>
        </div>
      )}
      {!(single && duration) && (
        <ChipRow t={t} label={t('When did this start?')} value={value.onset} onChange={(v) => update('onset', v)} options={ONSET_OPTIONS} />
      )}
      <ChipRow t={t} label={t('How did it start?')} value={value.onsetType} onChange={(v) => update('onsetType', v)} options={ONSET_TYPE_OPTIONS} />
      {injury && (
        <div className="rounded-xl bg-gray-50 p-4 space-y-4">
          <h4 className="text-sm font-semibold text-navy-600">{t('About the injury')}</h4>
          <div>
            <label className="form-label">{t('When did the injury happen?')}</label>
            <input type="text" value={value.injuryDate || ''} onChange={(e) => update('injuryDate', e.target.value)} placeholder={t('e.g., March 3, or about 2 weeks ago')} />
          </div>
          <ChipRow t={t} label={t('Can you put weight on it or use it?')} value={value.weightBearing} onChange={(v) => update('weightBearing', v)} options={WEIGHT_BEARING_OPTIONS} />
          <MultiChip t={t} label={t('Are you in any of these right now?')} options={IMMOBILIZATION_OPTIONS} selected={value.immobilized || []} onChange={(v) => update('immobilized', v.includes('None') && v[v.length - 1] === 'None' ? ['None'] : v.filter((x) => x !== 'None'))} />
          <div>
            <label className="form-label">{t('Where were you seen, and were X-rays taken?')}</label>
            <input type="text" value={value.seenWhere || ''} onChange={(e) => update('seenWhere', e.target.value)} placeholder={t('e.g., The emergency room on the day, X-ray showed a broken wrist; or not seen yet')} />
          </div>
        </div>
      )}
      <ChipRow t={t} label={t(text.progression)} value={value.progression} onChange={(v) => update('progression', v)} options={PROGRESSION_OPTIONS} />
      <PainScale label={t('How bad is it on a typical day? (0 to 10)')} value={value.severity == null ? '' : String(value.severity)} onChange={(v) => update('severity', v === '' ? '' : parseInt(v, 10))} />
      <MultiChip t={t} label={t('How would you describe it? (optional, tap all that apply)')} options={painQualities} selected={value.quality || []} onChange={(v) => update('quality', v)} />
      {asksMechanical && (
        <div>
          <label className="form-label">{t('Does the joint do any of these? (tap all that apply)')}</label>
          <div className="flex flex-wrap gap-2">
            {MECHANICAL_OPTIONS.map((opt) => (
              <button key={opt} type="button" onClick={() => toggleMech(opt)}
                className={`chip ${mech.includes(opt) ? 'chip-selected' : 'chip-unselected'}`}>
                {t(opt)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


// ===========================================================================
// The questions that change management, asked once. The list and the rule
// for showing each one come from the service (SAFETY_QUESTIONS in its
// problems module); every answer is stored under hpiData.overall.<field>.
// ===========================================================================
function SafetyCheck({ t, overall, update, questions, context }) {
  const shown = questions.filter((q) => !q.when || q.when(context));
  return (
    <div className="card mt-4 mb-4">
      <h4 className="text-base font-medium text-navy-600 mb-1">{t('Safety check')}</h4>
      <p className="text-sm text-gray-400 mb-4">{t('A few yes/no questions that matter for your care. Please answer each one.')}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {shown.map((q) => (
          q.options ? (
            <ChoiceQuestion key={q.field} t={t} label={q.label} options={q.options} value={overall[q.field]} onChange={(v) => update(q.field, v)} />
          ) : (
            <YesNoQuestion key={q.field} t={t} label={q.label} sublabel={q.sublabel} value={overall[q.field]} onChange={(v) => update(q.field, v)} />
          )
        ))}
      </div>
    </div>
  );
}


function ChipRow({ t, label, value, onChange, options }) {
  return (
    <div>
      <label className="form-label">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button key={opt} type="button" onClick={() => onChange(opt)}
            className={`chip ${value === opt ? 'chip-selected' : 'chip-unselected'}`}>
            {t(opt)}
          </button>
        ))}
      </div>
    </div>
  );
}

function MultiChip({ t, label, options, selected, onChange }) {
  return (
    <div>
      <label className="form-label">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const isOn = selected.includes(opt);
          return (
            <button key={opt} type="button"
              onClick={() => onChange(isOn ? selected.filter((x) => x !== opt) : [...selected, opt])}
              className={`chip ${isOn ? 'chip-selected' : 'chip-unselected'}`}>
              {t(opt)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function YesNoQuestion({ t, label, sublabel, value, onChange }) {
  return (
    <div className="p-3 bg-gray-50 rounded-xl">
      <p className="text-sm font-medium text-gray-700 mb-1">{t(label)}</p>
      {sublabel && <p className="text-xs text-gray-400 mb-2">{t(sublabel)}</p>}
      <div className="flex gap-2">
        {['Yes', 'No'].map((opt) => (
          <button key={opt} type="button" onClick={() => onChange(opt === 'Yes')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              value === (opt === 'Yes')
                ? opt === 'Yes'
                  ? 'bg-amber-100 text-amber-700 border border-amber-300'
                  : 'bg-green-100 text-green-700 border border-green-300'
                : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-300'
            }`}>
            {t(opt)}
          </button>
        ))}
      </div>
    </div>
  );
}

// A short choice in the safety check (which hand the patient writes with).
function ChoiceQuestion({ t, label, options, value, onChange }) {
  return (
    <div className="p-3 bg-gray-50 rounded-xl">
      <p className="text-sm font-medium text-gray-700 mb-1">{t(label)}</p>
      <div className="flex gap-2">
        {options.map((opt) => (
          <button key={opt} type="button" onClick={() => onChange(opt)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${value === opt ? 'bg-teal-100 text-teal-700 border border-teal-300' : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-300'}`}>
            {t(opt)}
          </button>
        ))}
      </div>
    </div>
  );
}
