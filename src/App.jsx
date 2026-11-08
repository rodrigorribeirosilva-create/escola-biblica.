import React, { useState } from 'react';
import { supabase } from './lib/supabaseClient';
import { BookOpen, GraduationCap, Search, PlayCircle, Clock3, Menu, X, ArrowRight, Plus, Settings, LogIn, ChevronRight, CheckCircle2, Layers } from 'lucide-react';

const initialCourses = [
  { id: 1, title: 'Fundamentos da Fé Cristã', tag: 'TEOLOGIA', level: 'Iniciante', time: '4h 20min', desc: 'Conheça os pilares da fé cristã e fortaleça suas bases na Palavra.', tone: 'green', modules: [{id:11,title:'As bases da fé',lessons:['O que é fé?','A Bíblia e sua autoridade','Conhecendo Deus']},{id:12,title:'A caminhada cristã',lessons:['Graça e salvação','Oração e comunhão']}] },
  { id: 2, title: 'Panorama do Antigo Testamento', tag: 'ESTUDO BÍBLICO', level: 'Intermediário', time: '6h 10min', desc: 'Uma jornada pelos livros, personagens e acontecimentos do Antigo Testamento.', tone: 'gold', modules: [{id:21,title:'Introdução',lessons:['Como a Bíblia está organizada','Contexto histórico']},{id:22,title:'Pentateuco',lessons:['Gênesis','Êxodo','Levítico']}] },
  { id: 3, title: 'Vida e Ensinamentos de Jesus', tag: 'EVANGELHOS', level: 'Iniciante', time: '3h 45min', desc: 'Explore o contexto, as parábolas e os ensinamentos de Jesus.', tone: 'blue', modules: [{id:31,title:'Conhecendo os Evangelhos',lessons:['O contexto dos Evangelhos','O nascimento de Jesus']},{id:32,title:'Os ensinamentos',lessons:['As parábolas','O Sermão do Monte']}] }
];

export default function App() {
  const [page,setPage] = useState(window.location.hash === '#painel' ? 'admin' : 'home');
  const [adminAuthorized,setAdminAuthorized] = useState(false);
  const [loginEmail,setLoginEmail] = useState('');
  const [loginPassword,setLoginPassword] = useState('');
  const [loginMessage,setLoginMessage] = useState('');
  const [creatingAccount,setCreatingAccount] = useState(false);
  const [newPassword,setNewPassword] = useState('');
  const [confirmPassword,setConfirmPassword] = useState('');
  const [passwordMessage,setPasswordMessage] = useState('');
  const loginAdmin = async (e) => { e.preventDefault(); setLoginMessage('Verificando acesso...'); const {data,error} = await supabase.auth.signInWithPassword({email:loginEmail,password:loginPassword}); if(error){setLoginMessage('E-mail ou senha incorretos.');return;} const {data:profile,error:profileError}=await supabase.from('profiles').select('role').eq('id',data.user.id).single(); if(profileError || profile?.role!=='admin'){await supabase.auth.signOut();setLoginMessage('Esta conta não tem permissão de administrador.');return;} setAdminAuthorized(true);setLoginMessage(''); }
  const registerAdminAccount = async (e) => { e.preventDefault(); setLoginMessage('Enviando confirmação para seu e-mail...'); const {data,error}=await supabase.auth.signUp({email:loginEmail,password:loginPassword,options:{data:{full_name:'Luciano'}}}); if(error){setLoginMessage(error.message);return;} setLoginMessage(data.session?'Conta criada. Aguarde a liberação administrativa.':'Conta criada. Confirme o e-mail enviado para lucianodnst@gmail.com; depois farei a liberação do perfil de administrador.'); }
  const changeAdminPassword = async (e) => { e.preventDefault(); if(newPassword.length<8){setPasswordMessage('Use pelo menos 8 caracteres.');return;} if(newPassword!==confirmPassword){setPasswordMessage('As senhas não coincidem.');return;} const {error}=await supabase.auth.updateUser({password:newPassword}); setPasswordMessage(error?'Não foi possível alterar a senha: '+error.message:'Senha alterada com sucesso.'); if(!error){setNewPassword('');setConfirmPassword('');} }
  const logoutAdmin = async () => { await supabase.auth.signOut(); setAdminAuthorized(false); go('home'); };
  const [mobile,setMobile] = useState(false);
  const [courses,setCourses] = useState(initialCourses);
  const [query,setQuery] = useState('');
  const [adding,setAdding] = useState(false);
  const [courseName,setCourseName] = useState('');
  const [courseDesc,setCourseDesc] = useState('');
  const [selected,setSelected] = useState(null);
  const [expanded,setExpanded] = useState(0);
  const [moduleName,setModuleName] = useState('');
  const [addingModule,setAddingModule] = useState(false);
  const [addingLessonFor,setAddingLessonFor] = useState(0);
  const [lessonName,setLessonName] = useState('');
  const [completedLessons,setCompletedLessons] = useState({});
  const [selectedLesson,setSelectedLesson] = useState(null);

  const go = (next) => { setPage(next); setMobile(false); window.scrollTo(0,0); };
  const openCourse = (course) => { setSelected(course); setExpanded(course.modules[0]?.id || 0); go('detail'); };
  const openLesson = (course,module,lesson,index) => { setSelectedLesson({course,module,lesson,index,key:course.id+'-'+module.id+'-'+index}); go('lesson'); };
  const saveCourse = (e) => {
    e.preventDefault();
    const course = {id:Date.now(),title:courseName,tag:'NOVO CURSO',level:'Iniciante',time:'A definir',desc:courseDesc,tone:'green',modules:[]};
    setCourses([...courses,course]); setCourseName(''); setCourseDesc(''); setAdding(false);
  };
  const saveModule = (e) => {
    e.preventDefault();
    if (!selected || !moduleName.trim()) return;
    const updated = {...selected,modules:[...selected.modules,{id:Date.now(),title:moduleName.trim(),lessons:[]}]};
    setCourses(courses.map(c=>c.id===selected.id?updated:c)); setSelected(updated); setModuleName(''); setAddingModule(false);
  };
  const saveLesson = (e, moduleId) => {
    e.preventDefault();
    if (!selected || !lessonName.trim()) return;
    const updated = {...selected,modules:selected.modules.map(m=>m.id===moduleId?{...m,lessons:[...m.lessons,lessonName.trim()]}:m)};
    setCourses(courses.map(c=>c.id===selected.id?updated:c)); setSelected(updated); setLessonName(''); setAddingLessonFor(0);
  };
  const filtered = courses.filter(c=>c.title.toLowerCase().includes(query.toLowerCase()));

  return <>
    <header>
      <button className="brand" onClick={()=>go('home')}><span><BookOpen/></span><b>ESCOLA BÍBLICA<small>CONHECIMENTO QUE TRANSFORMA</small></b></button>
      <button className="hamb" onClick={()=>setMobile(!mobile)}>{mobile?<X/>:<Menu/>}</button>
      <nav className={mobile?'show':''}><button onClick={()=>go('home')}>Início</button><button onClick={()=>go('courses')}>Cursos</button><button onClick={()=>go('about')}>Sobre</button><button className="navlogin" onClick={()=>go('student')}><LogIn size={16}/> Área do aluno</button></nav>
    </header>

    {page==='home' && <>
      <section className="hero"><div><label>✦ APRENDA NO SEU RITMO</label><h1>Conheça a Palavra.<br/><i>Transforme sua vida.</i></h1><p>Uma jornada de aprendizado bíblico para aprofundar seu conhecimento, fortalecer sua fé e viver os ensinamentos das Escrituras.</p><button className="primary" onClick={()=>go('courses')}>Explorar cursos <ArrowRight size={17}/></button><small className="note">Aprendizado com propósito. Conteúdo organizado para sua caminhada.</small></div><div className="visual"><div className="book"><p>“Lâmpada para os meus pés é tua palavra, e luz para o meu caminho.”</p><small>SALMOS 119:105</small><BookOpen size={65}/><small>ESTUDE • APRENDA • VIVA</small></div></div></section>
      <section className="features"><div><BookOpen/><b>Estudo organizado<small>Cursos por temas e módulos</small></b></div><div><PlayCircle/><b>Aulas acessíveis<small>Aprenda no seu tempo</small></b></div><div><GraduationCap/><b>Crescimento contínuo<small>Avance a cada aprendizado</small></b></div></section>
      <main className="wrap"><label>COMECE SUA JORNADA</label><h2>Cursos em destaque</h2><div className="cards">{courses.slice(0,3).map(c=><Course key={c.id} course={c} onClick={()=>openCourse(c)}/>)}</div></main>
      <section className="verse">“Antes, crescei na graça e conhecimento de nosso Senhor e Salvador Jesus Cristo.”<small>2 PEDRO 3:18</small></section>
    </>}

    {page==='courses' && <main className="wrap page"><label>BIBLIOTECA DE APRENDIZADO</label><h1>Nossos cursos</h1><p>Encontre seu próximo passo no conhecimento da Palavra.</p><div className="search"><Search/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar curso..."/></div><div className="cards">{filtered.map(c=><Course key={c.id} course={c} onClick={()=>openCourse(c)}/>)}</div>{filtered.length===0&&<p>Nenhum curso encontrado. Tente outra busca.</p>}</main>}

    {page==='detail' && selected && <main className="wrap page"><button className="backlink" onClick={()=>go('courses')}>← Voltar aos cursos</button><label>{selected.tag}</label><h1>{selected.title}</h1><p>{selected.desc}</p><div className="detail-layout"><section className="panel"><div className="detail-heading"><Layers/><h2>Conteúdo do curso</h2></div><p>{selected.modules.length} módulos • {selected.modules.reduce((n,m)=>n+m.lessons.length,0)} aulas cadastradas</p>{selected.modules.map((m,i)=><div className="module" key={m.id}><button className="module-toggle" onClick={()=>setExpanded(expanded===m.id?0:m.id)}><span><b>MÓDULO {i+1}</b>{m.title}</span><ChevronRight className={expanded===m.id?'turned':''}/></button>{expanded===m.id&&<div className="lesson-list">{m.lessons.length?m.lessons.map((l,j)=><button className="lesson lesson-open" key={j} onClick={()=>openLesson(selected,m,l,j)}><PlayCircle size={17}/><span>Aula {j+1}: {l}</span><small>{completedLessons[selected.id+'-'+m.id+'-'+j]?'Concluída':'Abrir aula'}</small></button>):<p className="empty">As aulas deste módulo serão adicionadas pelo administrador.</p>}</div>}</div>)}</section><aside className="panel course-aside"><BookOpen size={32}/><h2>Comece a estudar</h2><p>O acesso às aulas será liberado quando o cadastro e a área do aluno estiverem conectados.</p><button className="primary" onClick={()=>go('student')}>Área do aluno <ArrowRight size={16}/></button></aside></div></main>}

    {page==='lesson' && selectedLesson && <main className="wrap page"><button className="backlink" onClick={()=>{setSelected(selectedLesson.course);go('detail')}}>← Voltar ao curso</button><label>{selectedLesson.course.title.toUpperCase()}</label><h1 className="lesson-title">{selectedLesson.lesson}</h1><p>{selectedLesson.module.title} • Aula {selectedLesson.index+1}</p><section className="lesson-player"><div className="lesson-player-icon"><PlayCircle size={54}/></div><b>Conteúdo da aula</b><p>O espaço para vídeo, áudio ou material de estudo será disponibilizado quando o administrador publicar o conteúdo desta aula.</p><small>AINDA NÃO HÁ VÍDEO PUBLICADO</small></section><article className="panel lesson-notes"><h2>O que você vai aprender</h2><p>Esta aula está cadastrada na estrutura do curso. O conteúdo didático ainda precisa ser incluído pelo administrador.</p><button className="primary" onClick={()=>{setCompletedLessons({...completedLessons,[selectedLesson.key]:!completedLessons[selectedLesson.key]});}}>{completedLessons[selectedLesson.key]?'Desmarcar conclusão':'Marcar aula como concluída'} <CheckCircle2 size={16}/></button></article></main>}

    {page==='about' && <main className="wrap page"><label>NOSSA MISSÃO</label><h1>Conhecimento que transforma.</h1><p>A Escola Bíblica nasce com o propósito de tornar o estudo das Escrituras mais organizado, acessível e constante.</p><article className="panel"><BookOpen size={38}/><h2>Aprender para viver</h2><p>Apoiar pessoas que desejam conhecer melhor a Bíblia, compreender seu contexto e aplicar seus ensinamentos no dia a dia.</p></article></main>}

    {page==='student' && <main className="wrap page"><label>AMBIENTE DO ESTUDANTE</label><h1>Minha aprendizagem</h1><article className="student-banner"><div><GraduationCap size={28}/><div><b>Prévia da área do aluno</b><small>Esta é uma demonstração. O login real será ativado após a conexão segura com o banco de dados.</small></div></div><span>DEMONSTRAÇÃO</span></article><div className="student-summary"><div><b>{courses.length}</b><small>Cursos disponíveis</small></div><div><b>{Object.values(completedLessons).filter(Boolean).length}</b><small>Aulas concluídas nesta sessão</small></div><div><b>{courses.reduce((n,c)=>n+c.modules.reduce((a,m)=>a+m.lessons.length,0),0)}</b><small>Aulas no catálogo</small></div></div><h2>Continue aprendendo</h2><div className="student-courses">{courses.map(c=>{const all=c.modules.flatMap(m=>m.lessons.map((lesson,j)=>completedLessons[c.id+'-'+m.id+'-'+j]));const total=all.length;const done=all.filter(Boolean).length;const pct=total?Math.round(done/total*100):0;return <article className="student-course" key={c.id}><div><small>{c.tag}</small><h3>{c.title}</h3><p>{c.desc}</p><div className="progress-track"><span style={{width:pct+'%'}}/></div><small>{done} de {total} aulas concluídas • {pct}%</small></div><button className="primary" onClick={()=>openCourse(c)}>Abrir curso <ArrowRight size={15}/></button><div className="student-checklist">{c.modules.map(m=><section key={m.id}><b>{m.title}</b>{m.lessons.map((lesson,j)=>{const key=c.id+'-'+m.id+'-'+j;return <label className="progress-lesson" key={key}><input type="checkbox" checked={!!completedLessons[key]} onChange={e=>setCompletedLessons({...completedLessons,[key]:e.target.checked})}/>{lesson}</label>})}</section>)}</div></article>})}</div><p className="notice">O progresso marcado aqui é temporário e será perdido ao atualizar a página. Para salvar por aluno, precisamos conectar a autenticação e o banco de dados.</p></main>}

    {page==='admin' && !adminAuthorized && <main className="wrap page"><label>ACESSO RESTRITO</label><h1>Painel administrativo</h1><p>Entre com a conta autorizada de administrador.</p><form className="panel adminform" onSubmit={creatingAccount?registerAdminAccount:loginAdmin}><input type="email" value={loginEmail} onChange={e=>setLoginEmail(e.target.value)} placeholder="E-mail do administrador" required/><input type="password" value={loginPassword} onChange={e=>setLoginPassword(e.target.value)} placeholder="Senha" required/><button className="primary">{creatingAccount?'Criar conta':'Entrar no painel'} <ArrowRight size={16}/></button><button type="button" className="module-add" onClick={()=>{setCreatingAccount(!creatingAccount);setLoginMessage('');}}>{creatingAccount?'Já tenho conta — entrar':'Primeiro acesso? Criar conta Luciano'}</button>{loginMessage&&<p role="status">{loginMessage}</p>}</form></main>}
    {page==='admin' && adminAuthorized && <main className="wrap page"><label>GESTÃO DA PLATAFORMA</label><h1>Painel administrativo</h1><div className="stats"><b>{courses.length}<small>Cursos cadastrados</small></b><b>0<small>Alunos registrados</small></b><b>{courses.reduce((n,c)=>n+c.modules.reduce((a,m)=>a+m.lessons.length,0),0)}<small>Aulas cadastradas</small></b></div><article className="panel adminform"><h2>Segurança da conta</h2><p>Altere sua senha diretamente pelo painel.</p><form onSubmit={changeAdminPassword}><input type="password" autoComplete="new-password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} placeholder="Nova senha (mínimo 8 caracteres)" required/><input type="password" autoComplete="new-password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} placeholder="Confirme a nova senha" required/><button className="primary">Alterar senha</button>{passwordMessage&&<p role="status">{passwordMessage}</p>}</form><button className="module-add" onClick={logoutAdmin}>Sair do painel</button></article><div className="adminhead"><h2>Gerenciar cursos</h2><button className="primary" onClick={()=>setAdding(!adding)}><Plus/> Novo curso</button></div>{adding&&<form className="panel adminform" onSubmit={saveCourse}><input value={courseName} onChange={e=>setCourseName(e.target.value)} placeholder="Nome do curso" required/><textarea value={courseDesc} onChange={e=>setCourseDesc(e.target.value)} placeholder="Descrição do curso"/><button className="primary">Salvar curso</button></form>}{courses.map(c=><article className="rowitem admin-course" key={c.id}><div><b>{c.title}</b><small>{c.tag} • {c.modules.length} módulos • {c.modules.reduce((n,m)=>n+m.lessons.length,0)} aulas</small></div><button onClick={()=>{setSelected(c);go('manage')}}>Gerenciar conteúdo <ArrowRight size={15}/></button></article>)}</main>}

    {page==='manage' && selected && <main className="wrap page"><button className="backlink" onClick={()=>go('admin')}>← Voltar ao painel</button><label>ORGANIZAÇÃO DO CONTEÚDO</label><h1>{selected.title}</h1><p>Cadastre os módulos que vão organizar as aulas deste curso.</p><div className="adminhead"><h2>Módulos do curso</h2><button className="primary" onClick={()=>setAddingModule(!addingModule)}><Plus/> Novo módulo</button></div>{addingModule&&<form className="panel adminform" onSubmit={saveModule}><input value={moduleName} onChange={e=>setModuleName(e.target.value)} placeholder="Nome do módulo" required/><button className="primary">Adicionar módulo</button></form>}{selected.modules.map((m,i)=><article className="rowitem manage-module" key={m.id}><div><b>Módulo {i+1}: {m.title}</b><small>{m.lessons.length} aulas cadastradas</small></div><ul className="managed-lessons">{m.lessons.map((lesson,j)=><li key={j}><CheckCircle2 size={14}/>{lesson}</li>)}</ul><button className="module-add" onClick={()=>setAddingLessonFor(addingLessonFor===m.id?0:m.id)}><Plus size={14}/> Adicionar aula</button>{addingLessonFor===m.id&&<form className="lesson-form" onSubmit={e=>saveLesson(e,m.id)}><input value={lessonName} onChange={e=>setLessonName(e.target.value)} placeholder="Título da aula" required/><button className="primary">Salvar aula</button></form>}</article>)}{selected.modules.length===0&&<article className="panel"><p>Este curso ainda não tem módulos. Use “Novo módulo” para começar.</p></article>}<p className="notice">Os módulos e títulos das aulas ficam apenas nesta demonstração enquanto o banco de dados não estiver conectado. Ainda não há gravação permanente nem vídeo/aula publicado.</p></main>}

    <footer><b>◈ ESCOLA BÍBLICA</b><span>Conhecimento que transforma.</span><button onClick={()=>go('admin')}><Settings size={15}/> Administração</button></footer>
  </>;
}

function Course({course,onClick}) { const count=course.modules.reduce((n,m)=>n+m.lessons.length,0); return <article className="course" onClick={onClick}><div className={'cover '+course.tone}><small>{course.tag}</small><BookOpen size={45}/><small>ESCOLA BÍBLICA</small></div><div className="coursebody"><small>{course.level}　•　<Clock3 size={12}/> {course.time}</small><h3>{course.title}</h3><p>{course.desc}</p><div>{count} aulas <b>Conhecer curso →</b></div></div></article>; }
