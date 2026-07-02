import './Home.css'

function Home() {
  return (
    <div className="home">
      <h1>Exam Station</h1>
      <p className="home-blurb">
        Two windows, one exam. Open <strong>Control</strong> on your laptop to
        run things, and <strong>Display</strong> full-screen on the
        projector for students to see. They stay in sync automatically.
      </p>
      <div className="home-links">
        <a className="home-link control" href="#/control" target="_blank" rel="noopener">
          Open Control
          <span>your laptop, hidden from students</span>
        </a>
        <a className="home-link go-display" href="#/display" target="_blank" rel="noopener">
          Open Display
          <span>the projector, full-screen</span>
        </a>
      </div>
    </div>
  )
}

export default Home
