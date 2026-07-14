import React, { useState, useRef } from 'react';

export default function App() {
  const [user, setUser] = useState({ name: '', email: '', courses: [], loggedIn: false });
  const [posts, setPosts] = useState([]);
  const [step, setStep] = useState('login');
  const [activeModule, setActiveModule] = useState('feed');
  const [newPost, setNewPost] = useState('');
  const [image, setImage] = useState(null);
  const fileInputRef = useRef(null);

  // --- Handlers ---
  const handlePost = () => {
    if (!newPost && !image) return;
    const post = { 
      id: Date.now(), 
      author: user.name, 
      content: newPost, 
      media: image,
      course: user.courses[0] 
    };
    setPosts([post, ...posts]);
    setNewPost('');
    setImage(null);
  };

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setImage(URL.createObjectURL(e.target.files[0]));
    }
  };

  // --- UI Sections ---
  if (step === 'login') return (
    <div style={styles.authContainer}>
      <div style={styles.card}>
        <h1>INCOG <span style={{color: '#0a66c2'}}>PSD</span></h1>
        <input placeholder="Name" style={styles.input} onChange={(e) => setUser({...user, name: e.target.value})} />
        <input placeholder="Email" style={styles.input} onChange={(e) => setUser({...user, email: e.target.value})} />
        <button style={styles.btn} onClick={() => setStep('course')}>Next</button>
      </div>
    </div>
  );

  if (step === 'course') return (
    <div style={styles.authContainer}>
      <div style={styles.card}>
        <h3>Select 2 Courses</h3>
        {['IoT', 'Robotics', 'Web Dev', 'AI Eng', 'Embedded'].map(c => (
          <button key={c} style={{...styles.courseBtn, background: user.courses.includes(c) ? '#0a66c2' : '#fff'}}
            onClick={() => user.courses.includes(c) ? setUser({...user, courses: user.courses.filter(i => i !== c)}) : user.courses.length < 2 && setUser({...user, courses: [...user.courses, c]})}>
            {c}
          </button>
        ))}
        <button style={styles.btn} disabled={user.courses.length !== 2} onClick={() => setStep('dashboard')}>Enter</button>
      </div>
    </div>
  );

  return (
    <div style={styles.layout}>
      <nav style={styles.navbar}>
        <h2>INCOG PSD</h2>
        <div style={{display:'flex', gap:'20px'}}>
          <button onClick={() => setActiveModule('feed')}>Home</button>
          <button onClick={() => setActiveModule('alerts')}>🔔 Alerts</button>
        </div>
      </nav>

      <div style={styles.grid}>
        <aside style={styles.card}>
          <h4>My Profile</h4>
          <p>{user.name}</p>
          <hr/>
          <button style={styles.navBtn} onClick={() => setActiveModule('broadcast')}>📢 Broadcast</button>
        </aside>

        <main style={styles.card}>
          <textarea style={styles.textarea} placeholder="Start a post..." value={newPost} onChange={(e) => setNewPost(e.target.value)} />
          <div style={{display: 'flex', gap: '10px'}}>
            <button style={styles.subBtn} onClick={() => fileInputRef.current.click()}>📷 Media</button>
            <input type="file" ref={fileInputRef} hidden onChange={handleImageChange} />
            <button style={styles.btn} onClick={handlePost}>Post</button>
          </div>
          {image && <img src={image} alt="preview" style={{width: '100%', marginTop: '10px'}} />}
          
          <div style={{marginTop: '20px'}}>
            {posts.map(p => (
              <div key={p.id} style={{borderBottom: '1px solid #eee', padding: '10px 0'}}>
                <strong>{p.author}</strong>
                <p>{p.content}</p>
                {p.media && <img src={p.media} style={{width: '100%'}} />}
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

const styles = {
  layout: { background: '#f3f2ef', minHeight: '100vh' },
  navbar: { background: '#fff', padding: '10px 15%', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #ddd' },
  grid: { display: 'grid', gridTemplateColumns: '250px 600px', gap: '20px', padding: '20px 15%' },
  card: { background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #ddd' },
  input: { width: '100%', padding: '10px', margin: '5px 0' },
  btn: { background: '#0a66c2', color: '#fff', padding: '10px', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  subBtn: { background: '#e1e7ed', padding: '10px', border: 'none', cursor: 'pointer' },
  textarea: { width: '100%', height: '80px', marginBottom: '10px' },
  courseBtn: { display: 'block', width: '100%', padding: '10px', margin: '5px 0', cursor: 'pointer' },
  authContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }
};