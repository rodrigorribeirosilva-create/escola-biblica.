import React, { useState } from 'react';
import { BookOpen, GraduationCap, Search, PlayCircle, Clock3, Menu, X, ArrowRight, Plus, Settings, LogIn, ChevronRight, CheckCircle2, Layers } from 'lucide-react';

const initialCourses = [
  { id: 1, title: 'Fundamentos da Fé Cristã', tag: 'TEOLOGIA', level: 'Iniciante', time: '4h 20min', desc: 'Conheça os pilares da fé cristã e fortaleça suas bases na Palavra.', tone: 'green', modules: [{id:11,title:'As bases da fé',lessons:['O que é fé?','A Bíblia e sua autoridade','Conhecendo Deus']},{id:12,title:'A caminhada cristã',lessons:['Graça e salvação','Oração e comunhão']}] },
  { id: 2, title: 'Panorama do Antigo Testamento', tag: 'ESTUDO BÍBLICO', level: 'Intermediário', time: '6h 10min', desc: 'Uma jornada pelos livros, personagens e acontecimentos do Antigo Testamento.', tone: 'gold', modules: [{id:21,title:'Introdução',lessons:['Como a Bíblia está organizada','Contexto histórico']},{id:22,title:'Pentateuco',lessons:['Gênesis','Êxodo','Levítico']}] },
  { id: 3, title: 'Vida e Ensinamentos de Jesus', tag: 'EVANGELHOS', level: 'Iniciante', time: '3h 45min', desc: 'Explore o contexto, as parábolas e os ensinamentos de Jesus.', tone: 'blue', modules: [{id:31,title:'Conhecendo os Evangelhos',lessons:['O contexto dos Evangelhos','O nascimento de Jesus']},{id:32,title:'Os ensinamentos',lessons:['As parábolas','O Sermão do Monte']}] }
];

export default function App() {
  const [page,setPage] = useState('home');
  const [mobile,setMobile] = useState(false);
  const [courses,setCourses] = useState(initialCourses);
  const [query,setQuery] = useState('');
  const [adding,setAdding] = useState(false);
  const [courseName,setCourseName] = useState('');
  const [courseDesc,setCourseDesc] = useState('');
  const [selected,setSelected] = useState(null);
  const [expanded,setExpanded] = useState(0);
  const [moduleName,setModuleName] = useState('');
  const [addingModule,setAddingModule] = useState(false);\n  const [addingLessonFor,setAddingLessonFor] = useState(0);\n  const [lessonName,setLessonName] = useState('');

  const go = (next) => { setPage(next); setMobile(false); window.scrollTo(0,0); };
  const openCourse = (course) => { setSelected(course); setExpanded(course.modules[0]?.id || 0); go('detail'); };
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

    {page==='detail' && selected && <main className="wrap page"><button className="backlink" onClick={()=>go('courses')}>← Voltar aos cursos</button><label>{selected.tag}</label><h1>{selected.title}</h1><p>{selected.desc}</p><div className="detail-layout"><section className="panel"><div className="detail-heading"><Layers/><h2>Conteúdo do curso</h2></div><p>{selected.modules.length} módulos • {selected.modules.reduce((n,m)=>n+m.lessons.length,0)} aulas cadastradas</p>{selected.modules.map((m,i)=><div className="module" key={m.id}><button className="module-toggle" onClick={()=>setExpanded(expanded===m.id?0:m.id)}><span><b>MÓDULO {i+1}</b>{m.title}</span><ChevronRight className={expanded===m.id?'turned':''}/></button>{expanded===m.id&&<div className="lesson-list">{m.lessons.length?m.lessons.map((l,j)=><div className="lesson" key={j}><PlayCircle size={17}/><span>Aula {j+1}: {l}</span><small>Em breve</small></div>):<p className="empty">As aulas deste módulo serão adicionadas pelo administrador.</p>}</div>}</div>)}</section><aside className="panel course-aside"><BookOpen size={32}/><h2>Comece a estudar</h2><p>O acesso às aulas será liberado quando o cadastro e a área do aluno estiverem conectados.</p><button className="primary" onClick={()=>go('student')}>Área do aluno <ArrowRight size={16}/></button></aside></div></main>}

    {page==='about' && <main className="wrap page"><label>NOSSA MISSÃO</label><h1>Conhecimento que transforma.</h1><p>A Escola Bíblica nasce com o propósito de tornar o estudo das Escrituras mais organizado, acessível e constante.</p><article className="panel"><BookOpen size={38}/><h2>Aprender para viver</h2><p>Apoiar pessoas que desejam conhecer melhor a Bíblia, compreender seu contexto e aplicar seus ensinamentos no dia a dia.</p></article></main>}

    {page==='student' && <main className="wrap page"><label>SUA JORNADA CONTINUA</label><h1>Área do aluno</h1><article className="panel login"><GraduationCap size={36}/><h2>Acesso do aluno</h2><p>O cadastro e o login seguros serão conectados na próxima etapa. Enquanto isso, você já pode conhecer a organização dos cursos.</p><input placeholder="Seu e-mail" disabled/><input placeholder="Sua senha" disabled/><button className="primary" disabled>Entrar em breve</button></article><h2>Conheça os cursos</h2><div className="cards">{courses.map(c=><Course key={c.id} course={c} onClick={()=>openCourse(c)}/>)}</div></main>}

    {page==='admin' && <main className="wrap page"><label>GESTÃO DA PLATAFORMA</label><h1>Painel administrativo</h1><div className="stats"><b>{courses.length}<small>Cursos cadastrados</small></b><b>0<small>Alunos registrados</small></b><b>{courses.reduce((n,c)=>n+c.modules.reduce((a,m)=>a+m.lessons.length,0),0)}<small>Aulas cadastradas</small></b></div><div className="adminhead"><h2>Gerenciar cursos</h2><button className="primary" onClick={()=>setAdding(!adding)}><Plus/> Novo curso</button></div>{adding&&<form className="panel adminform" onSubmit={saveCourse}><input value={courseName} onChange={e=>setCourseName(e.target.value)} placeholder="Nome do curso" required/><textarea value={courseDesc} onChange={e=>setCourseDesc(e.target.value)} placeholder="Descrição do curso"/><button className="primary">Salvar curso</button></form>}{courses.map(c=><article className="rowitem admin-course" key={c.id}><div><b>{c.title}</b><small>{c.tag} • {c.modules.length} módulos • {c.modules.reduce((n,m)=>n+m.lessons.length,0)} aulas</small></div><button onClick={()=>{setSelected(c);go('manage')}}>Gerenciar conteúdo <ArrowRight size={15}/></button></article>)}</main>}

    {page==='manage' && selected && <main className="wrap page"><button className="backlink" onClick={()=>go('admin')}>← Voltar ao painel</button><label>ORGANIZAÇÃO DO CONTEÚDO</label><h1>{selected.title}</h1><p>Cadastre os módulos que vão organizar as aulas deste curso.</p><div className="adminhead"><h2>Módulos do curso</h2><button className="primary" onClick={()=>setAddingModule(!addingModule)}><Plus/> Novo módulo</button></div>{addingModule&&<form className="panel adminform" onSubmit={saveModule}><input value={moduleName} onChange={e=>setModuleName(e.target.value)} placeholder="Nome do módulo" required/><button className="primary">Adicionar módulo</button></form>}{selected.modules.map((m,i)=><article className="rowitem manage-module" key={m.id}><div><b>Módulo {i+1}: {m.title}</b><small>{m.lessons.length} aulas cadastradas</small></div><ul className="managed-lessons">{m.lessons.map((lesson,j)=><li key={j}><CheckCircle2 size={14}/>{lesson}</li>)}</ul><button className="module-add" onClick={()=>setAddingLessonFor(addingLessonFor===m.id?0:m.id)}><Plus size={14}/> Adicionar aula</button>{addingLessonFor===m.id&&<form className="lesson-form" onSubmit={e=>saveLesson(e,m.id)}><input value={lessonName} onChange={e=>setLessonName(e.target.value)} placeholder="Título da aula" required/><button className="primary">Salvar aula</button></form>}</article>)}{selected.modules.length===0&&<article className="panel"><p>Este curso ainda não tem módulos. Use “Novo módulo” para começar.</p></article>}<p className="notice">Os módulos e títulos das aulas ficam apenas nesta demonstração enquanto o banco de dados não estiver conectado. Ainda não há gravação permanente nem vídeo/aula publicado.</p></main>}

    <footer><b>◈ ESCOLA BÍBLICA</b><span>Conhecimento que transforma.</span><button onClick={()=>go('admin')}><Settings size={15}/> Administração</button></footer>
  </>;
}

function Course({course,onClick}) { const count=course.modules.reduce((n,m)=>n+m.lessons.length,0); return <article className="course" onClick={onClick}><div className={'cover '+course.tone}><small>{course.tag}</small><BookOpen size={45}/><small>ESCOLA BÍBLICA</small></div><div className="coursebody"><small>{course.level}　•　<Clock3 size={12}/> {course.time}</small><h3>{course.title}</h3><p>{course.desc}</p><div>{count} aulas <b>Conhecer curso →</b></div></div></article>; }
