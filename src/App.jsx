import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, FileText, PlayCircle, ArrowUpRight, Search, Menu, X, Plus, Settings, Trash2, ExternalLink, PenLine, Youtube, ChevronRight, LogOut, LockKeyhole } from 'lucide-react';
import { supabase } from './lib/supabase';

const emptySettings = {
  name: 'BIBLIOTECA DIGITAL',
  tagline: 'CONHECIMENTO QUE TRANSFORMA',
  headline: 'Ideias que despertam.',
  highlight: 'Conhecimento que transforma.',
  intro: 'Artigos, materiais de leitura e conteúdos em vídeo para fortalecer sua mente, sua fé e seu propósito.',
  youtube: '',
  instagram: '',
  whatsapp: '',
  cover: '',
  logo: ''
};

const mapSettings = (row) => ({
  name: row.site_name || emptySettings.name,
  tagline: row.tagline || emptySettings.tagline,
  headline: row.hero_title || emptySettings.headline,
  highlight: row.hero_highlight || emptySettings.highlight,
  intro: row.presentation || emptySettings.intro,
  youtube: row.youtube_url || '',
  instagram: row.instagram_url || '',
  whatsapp: row.whatsapp_url || '',
  cover: row.cover_image_url || '',
  logo: row.logo_url || ''
});

const mapItem = (row) => ({
  id: row.id,
  type: row.type,
  title: row.title,
  category: row.category || '',
  description: row.description || '',
  body: row.body || '',
  url: row.type === 'ebook' ? (row.file_url || '') : (row.external_url || ''),
  is_published: row.is_published,
  display_order: row.display_order || 0
});

export default function App() {
  const [items, setItems] = useState([]);
  const [tab, setTab] = useState('todos');
  const [query, setQuery] = useState('');
  const [mobile, setMobile] = useState(false);
  const [admin, setAdmin] = useState(location.hash === '#admin');
  const [user, setUser] = useState(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ type: 'article', title: '', category: '', description: '', body: '', url: '', is_published: true });
  const [notice, setNotice] = useState('');
  const [settings, setSettings] = useState(emptySettings);
  const [settingsId, setSettingsId] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.app_metadata?.role === 'admin';

  const loadData = async (adminMode = false) => {
    setLoading(true);
    const [settingsResult, itemsResult] = await Promise.all([
      supabase.from('library_settings').select('*').limit(1).maybeSingle(),
      supabase.from('library_items').select('*').order('display_order', { ascending: true }).order('created_at', { ascending: false })
    ]);
    if (settingsResult.error) setNotice('Não foi possível carregar as configurações da biblioteca.');
    if (settingsResult.data) {
      setSettingsId(settingsResult.data.id);
      setSettings(mapSettings(settingsResult.data));
    }
    if (itemsResult.error) {
      setNotice('Não foi possível carregar os conteúdos. Confira a conexão com o banco.');
      setItems([]);
    } else {
      setItems((itemsResult.data || []).map(mapItem));
    }
    setLoading(false);
  };

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setUser(data.session?.user || null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    loadData(isAdmin);
  }, [isAdmin]);

  useEffect(() => {
    const fn = () => setAdmin(location.hash === '#admin');
    window.addEventListener('hashchange', fn);
    return () => window.removeEventListener('hashchange', fn);
  }, []);

  useEffect(() => {
    if (user && user.app_metadata?.role !== 'admin') {
      supabase.auth.signOut();
      setLoginError('Este usuário não tem permissão de administrador.');
    }
  }, [user]);

  const filtered = useMemo(
    () => items.filter(x => (tab === 'todos' || x.type === tab) && [x.title, x.description, x.category].join(' ').toLowerCase().includes(query.toLowerCase())),
    [items, tab, query]
  );

  const openAdmin = () => { location.hash = 'admin'; setAdmin(true); setMobile(false); setNotice(''); };
  const closeAdmin = () => { history.replaceState(null, '', location.pathname + location.search); setAdmin(false); setEditing(null); setShowSettings(false); };
  const startNew = () => { setEditing('new'); setForm({ type: 'article', title: '', category: '', description: '', body: '', url: '', is_published: true }); };
  const edit = (item) => { setEditing(item.id); setForm({ ...item }); };
  const changeSetting = (key, value) => setSettings(old => ({ ...old, [key]: value }));

  const login = async (event) => {
    event.preventDefault();
    setLoggingIn(true);
    setLoginError('');
    const { data, error } = await supabase.auth.signInWithPassword({ email: loginEmail.trim(), password: loginPassword });
    setLoggingIn(false);
    if (error) { setLoginError('Não foi possível entrar. Confira o e-mail e a senha.'); return; }
    if (data.user?.app_metadata?.role !== 'admin') {
      await supabase.auth.signOut();
      setLoginError('A conta ainda não tem permissão de administrador.');
      return;
    }
    setLoginPassword('');
    setNotice('Acesso administrativo liberado.');
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setEditing(null);
    setNotice('Você saiu do painel.');
  };

  const saveSettings = async (event) => {
    event.preventDefault();
    if (!settingsId) return;
    const payload = {
      site_name: settings.name,
      tagline: settings.tagline,
      hero_title: settings.headline,
      hero_highlight: settings.highlight,
      presentation: settings.intro,
      youtube_url: settings.youtube || null,
      instagram_url: settings.instagram || null,
      whatsapp_url: settings.whatsapp || null,
      cover_image_url: settings.cover || null,
      logo_url: settings.logo || null,
      updated_at: new Date().toISOString()
    };
    const { error } = await supabase.from('library_settings').update(payload).eq('id', settingsId);
    if (error) { setNotice('Erro ao salvar personalização. Verifique sua permissão.'); return; }
    setShowSettings(false);
    setNotice('Personalização publicada para todos os visitantes.');
  };

  const save = async (event) => {
    event.preventDefault();
    if (!form.title.trim()) return;
    const payload = {
      type: form.type,
      title: form.title.trim(),
      category: form.category || null,
      description: form.description || null,
      body: form.type === 'article' ? (form.body || null) : null,
      file_url: form.type === 'ebook' ? (form.url || null) : null,
      external_url: form.type !== 'ebook' ? (form.url || null) : null,
      is_published: Boolean(form.is_published),
      updated_at: new Date().toISOString()
    };
    const result = editing === 'new'
      ? await supabase.from('library_items').insert(payload).select().single()
      : await supabase.from('library_items').update(payload).eq('id', editing).select().single();
    if (result.error) { setNotice('Não foi possível salvar. Confira seu acesso de administrador.'); return; }
    const saved = mapItem(result.data);
    setItems(old => editing === 'new' ? [saved, ...old] : old.map(x => x.id === editing ? saved : x));
    setEditing(null);
    setNotice(saved.is_published ? 'Conteúdo publicado para todos os visitantes.' : 'Conteúdo salvo como rascunho.');
  };

  const remove = async (id) => {
    if (!confirm('Excluir este conteúdo permanentemente?')) return;
    const { error } = await supabase.from('library_items').delete().eq('id', id);
    if (error) { setNotice('Não foi possível excluir este conteúdo.'); return; }
    setItems(old => old.filter(x => x.id !== id));
    setNotice('Conteúdo excluído.');
  };

  const typeLabel = { article: 'Artigo', ebook: 'E-book / PDF', video: 'Vídeo / Link', link: 'Link' };

  return <>
    <header className="top">
      <a className="brand" href="#inicio" onClick={() => setAdmin(false)}>
        <span className="brandmark"><BookOpen size={22} /></span>
        <span><b>{settings.name}</b><small>{settings.tagline}</small></span>
      </a>
      <button className="hamb" onClick={() => setMobile(!mobile)}>{mobile ? <X /> : <Menu />}</button>
      <nav className={mobile ? 'nav open' : 'nav'}>
        <a href="#inicio" onClick={() => setMobile(false)}>Início</a>
        <a href="#conteudos" onClick={() => setMobile(false)}>Conteúdos</a>
        <a href={settings.youtube || 'https://www.youtube.com/'} target="_blank" rel="noreferrer">YouTube <ArrowUpRight size={14} /></a>
        {settings.instagram && <a href={settings.instagram} target="_blank" rel="noreferrer">Instagram <ArrowUpRight size={14} /></a>}
        {settings.whatsapp && <a href={settings.whatsapp} target="_blank" rel="noreferrer">WhatsApp <ArrowUpRight size={14} /></a>}
        <button className="admin-link" onClick={openAdmin}><Settings size={15} /> Painel administrativo</button>
      </nav>
    </header>

    {admin ? <main className="admin wrap">
      {!isAdmin ? <section className="login-panel">
        <div className="login-icon"><LockKeyhole size={24} /></div>
        <span className="eyebrow">ACESSO RESTRITO</span>
        <h1>Painel administrativo</h1>
        <p>Entre com a conta de administrador para gerenciar a biblioteca.</p>
        <form className="editor" onSubmit={login}>
          <label>E-mail<input type="email" autoComplete="username" required value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="Seu e-mail de acesso" /></label>
          <label>Senha<input type="password" autoComplete="current-password" required value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder="Sua senha" /></label>
          {loginError && <p className="login-error">{loginError}</p>}
          <button className="dark-btn" disabled={loggingIn}>{loggingIn ? 'Entrando...' : 'Entrar no painel'}</button>
        </form>
        <button className="light-btn" onClick={closeAdmin}>Voltar à biblioteca</button>
      </section> : <>
        <div className="admin-title">
          <div><span className="eyebrow">ÁREA DE GESTÃO</span><h1>Painel administrativo</h1><p>Organize seus artigos, e-books e links em um só lugar.</p></div>
          <div className="admin-actions"><button className="light-btn" onClick={logout}><LogOut size={15} /> Sair</button><button className="dark-btn" onClick={closeAdmin}>Ver página pública <ExternalLink size={16} /></button></div>
        </div>
        <div className="admin-stats">
          <div><b>{items.length}</b><span>Conteúdos</span></div>
          <div><b>{items.filter(x => x.type === 'article').length}</b><span>Artigos</span></div>
          <div><b>{items.filter(x => x.type === 'ebook').length}</b><span>E-books</span></div>
          <div><b>{items.filter(x => x.type === 'video').length}</b><span>Links e vídeos</span></div>
        </div>
        <div className="admin-toolbar"><h2>Personalizar minha página</h2><button className="light-btn" onClick={() => setShowSettings(!showSettings)}>{showSettings ? 'Fechar opções' : 'Editar identidade'}</button></div>
        {showSettings && <form className="editor" onSubmit={saveSettings}>
          <h3>Identidade e aparência</h3>
          {[['name', 'Nome da página'], ['tagline', 'Frase curta'], ['headline', 'Título principal'], ['highlight', 'Texto em destaque'], ['intro', 'Apresentação'], ['youtube', 'Link do YouTube'], ['instagram', 'Link do Instagram'], ['whatsapp', 'Link do WhatsApp'], ['cover', 'URL da imagem de capa'], ['logo', 'URL da foto ou logotipo']].map(([key, label]) => <label key={key}>{label}<input value={settings[key]} onChange={e => changeSetting(key, e.target.value)} /></label>)}
          <button className="dark-btn">Salvar e publicar personalização</button>
        </form>}
        <div className="admin-toolbar"><h2>Seus conteúdos</h2><button className="gold-btn" onClick={startNew}><Plus size={17} /> Adicionar conteúdo</button></div>
        {editing !== null && <form className="editor" onSubmit={save}>
          <div className="editor-head"><h3>{editing === 'new' ? 'Novo conteúdo' : 'Editar conteúdo'}</h3><button type="button" className="icon-btn" onClick={() => setEditing(null)}><X /></button></div>
          <label>Tipo<select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}><option value="article">Artigo / material escrito</option><option value="ebook">E-book / PDF</option><option value="video">Vídeo ou link externo</option></select></label>
          <label>Título<input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Ex.: Inteligência emocional e fé" /></label>
          <label>Categoria<input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="Ex.: ESTUDO, REFLEXÃO, E-BOOK" /></label>
          <label>Descrição<textarea rows="2" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Breve apresentação do conteúdo" /></label>
          {form.type === 'article' ? <label>Texto do artigo<textarea rows="7" value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} placeholder="Escreva seu material aqui..." /></label> : <label>Link do PDF / vídeo / material<input type="url" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} placeholder="https://..." /></label>}
          <label className="publish-toggle"><input type="checkbox" checked={form.is_published} onChange={e => setForm({ ...form, is_published: e.target.checked })} /> Publicar imediatamente</label>
          <div className="editor-actions"><button type="button" className="light-btn" onClick={() => setEditing(null)}>Cancelar</button><button className="dark-btn">Salvar conteúdo</button></div>
        </form>}
        <div className="manage-list">{items.map(item => <article className="manage-row" key={item.id}>
          <div className="manage-icon">{item.type === 'article' ? <FileText /> : item.type === 'ebook' ? <BookOpen /> : <PlayCircle />}</div>
          <div className="manage-copy"><b>{item.title}</b><small>{typeLabel[item.type]} · {item.category || 'Sem categoria'} · {item.is_published ? 'Publicado' : 'Rascunho'}</small></div>
          <button className="icon-btn" aria-label="Editar" onClick={() => edit(item)}><PenLine size={17} /></button>
          <button className="icon-btn danger" aria-label="Excluir" onClick={() => remove(item.id)}><Trash2 size={17} /></button>
        </article>)}</div>
      </>}
      {notice && <p className="saved-note">{notice}</p>}
    </main> : <>
      <section className="hero" id="inicio" style={settings.cover ? { backgroundImage: `linear-gradient(90deg,rgba(18,37,29,.97),rgba(18,37,29,.82)),url("${settings.cover}")`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}>
        <div className="hero-inner"><span className="eyebrow">UM ESPAÇO PARA APRENDER E CRESCER</span><h1>{settings.headline}<br /><em>{settings.highlight}</em></h1><p>{settings.intro}</p><div className="hero-actions"><a className="gold-btn" href="#conteudos">Explorar conteúdos <ChevronRight size={17} /></a><a className="outline-btn" href={settings.youtube || 'https://www.youtube.com/'} target="_blank" rel="noreferrer"><Youtube size={17} /> Meu canal</a></div><div className="hero-foot"><span>LEIA · APRENDA · PRATIQUE</span><span>{settings.tagline}</span></div></div>
        <div className="hero-art"><div className="art-orbit"></div><div className="art-card">{settings.logo ? <img src={settings.logo} alt="Logotipo" style={{ maxWidth: 100, maxHeight: 80, objectFit: 'contain' }} /> : <BookOpen size={42} />}<span>{settings.name}</span><b>Conhecimento com propósito.</b><small>APRENDER • REFLETIR • TRANSFORMAR</small></div></div>
      </section>
      <section className="intro"><div><span className="eyebrow">BIBLIOTECA DE CONTEÚDOS</span><h2>Um lugar para encontrar<br />o próximo aprendizado.</h2></div><p>Explore materiais organizados para ler no seu tempo, aprofundar ideias e acessar conteúdos publicados no YouTube.</p></section>
      <main className="library wrap" id="conteudos"><div className="library-head"><div><span className="eyebrow">EXPLORE</span><h2>Conteúdos</h2></div><div className="search"><Search size={17} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar conteúdo" /></div></div>
        <div className="filters">{[['todos', 'Todos'], ['article', 'Artigos'], ['ebook', 'E-books'], ['video', 'Vídeos e links']].map(([key, label]) => <button key={key} className={tab === key ? 'active' : ''} onClick={() => setTab(key)}>{label}</button>)}</div>
        {loading ? <div className="empty">Carregando biblioteca...</div> : <div className="content-grid">{filtered.map(item => <article className="content-card" key={item.id}><div className={'card-visual ' + item.type}>{item.type === 'article' ? <FileText size={30} /> : item.type === 'ebook' ? <BookOpen size={30} /> : <PlayCircle size={30} />}<span>{item.category || typeLabel[item.type]}</span></div><div className="card-content"><small>{typeLabel[item.type]}</small><h3>{item.title}</h3><p>{item.description}</p>{item.type === 'article' ? <button className="text-link" onClick={() => setNotice(item.body || item.description)}>Ler material <ChevronRight size={15} /></button> : <a className="text-link" href={item.url || '#'} target="_blank" rel="noreferrer">{item.type === 'ebook' ? 'Acessar material' : 'Assistir / acessar'} <ArrowUpRight size={15} /></a>}</div></article>)}</div>}
        {!loading && filtered.length === 0 && <div className="empty">Nenhum conteúdo encontrado. Tente outra busca.</div>}
        {notice && !admin && <div className="article-reader"><button className="icon-btn" onClick={() => setNotice('')}><X /></button><p>{notice}</p></div>}
      </main>
      <section className="youtube-band"><div><Youtube size={32} /><div><span className="eyebrow">CONTINUE A JORNADA</span><h2>Mais conteúdos no YouTube.</h2><p>Acesse o canal e acompanhe novos vídeos e mensagens.</p></div></div><a href={settings.youtube || 'https://www.youtube.com/'} target="_blank" rel="noreferrer" className="outline-btn">Visitar canal <ArrowUpRight size={16} /></a></section>
    </>}
    <footer className="footer"><a className="brand foot-brand" href="#inicio"><span className="brandmark"><BookOpen size={20} /></span><span><b>{settings.name}</b><small>{settings.tagline}</small></span></a><span>© {new Date().getFullYear()} · Todos os direitos reservados</span><div className="footer-social">{settings.instagram && <a href={settings.instagram} target="_blank" rel="noreferrer">Instagram</a>}{settings.whatsapp && <a href={settings.whatsapp} target="_blank" rel="noreferrer">WhatsApp</a>}<a href="#inicio">Voltar ao topo ↑</a></div></footer>
  </>;
}
