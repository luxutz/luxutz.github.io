// Progressive React enhancement for the courses page
// Uses ESM CDN imports so you don't need a bundler

import React, { useEffect, useMemo, useState } from 'https://esm.sh/react@18?dev';
import { createRoot } from 'https://esm.sh/react-dom@18/client?dev';

// Utilities to scan existing DOM and extract course metadata
function scanCourses() {
  const container = document.querySelector('.kurssit-lista');
  if (!container) return { rows: [], styles: [], levels: [], teachers: [], days: [] };

  const rows = [];
  let currentStyle = '';
  // Iterate children; when we encounter an h2, set current style; then for following tables' rows, capture data
  const children = Array.from(container.children);
  for (let i = 0; i < children.length; i++) {
    const el = children[i];
    if (el.tagName === 'H2') {
      currentStyle = el.textContent.trim();
      continue;
    }
    if (el.tagName === 'TABLE') {
      const tbody = el.querySelector('tbody');
      if (!tbody) continue;
      Array.from(tbody.querySelectorAll('tr')).forEach((tr) => {
        const tds = tr.querySelectorAll('td');
        if (tds.length < 6) return; // price column optional
        const course = {
          style: currentStyle,
          name: tds[0].textContent.trim(),
          level: tds[1].textContent.trim(),
          teacher: tds[2].textContent.trim(),
          day: tds[3].textContent.replace(/\s+/g, ' ').trim(),
          time: tds[4].textContent.replace(/\s+/g, ' ').trim(),
          room: tds[5].textContent.trim(),
          price: tds[6] ? tds[6].textContent.trim() : '',
          tr,
        };
        rows.push(course);
      });
    }
  }

  const uniq = (arr) => Array.from(new Set(arr)).filter(Boolean);
  return {
    rows,
    styles: uniq(rows.map((r) => r.style)),
    levels: uniq(rows.map((r) => r.level)),
    teachers: uniq(rows.map((r) => r.teacher)),
    days: uniq(rows.map((r) => r.day)),
  };
}

// Helpers for advanced views
const DAY_INDEX = { 'Ma': 1, 'Ti': 2, 'Ke': 3, 'To': 4, 'Pe': 5, 'La': 6, 'Su': 7 };
function parseTimeRange(str) {
  // e.g. "17:00- 18:00" or "19:00-\n21:30"
  const cleaned = String(str).replace(/\s+/g, '').trim();
  const m = cleaned.match(/(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})/);
  if (!m) return null;
  const sH = parseInt(m[1], 10), sM = parseInt(m[2], 10), eH = parseInt(m[3], 10), eM = parseInt(m[4], 10);
  return { start: sH * 60 + sM, end: eH * 60 + eM };
}
const courseId = (c) => `${c.style}|${c.name}|${c.level}|${c.teacher}|${c.day}|${c.time}|${c.room}`;

function filterPredicate(filter) {
  return ({ style, level, teacher, day, name }) => {
    const textMatch = filter.q
      ? [name, style, level, teacher, day].join(' ').toLowerCase().includes(filter.q.toLowerCase())
      : true;
    const styleOk = filter.style ? style === filter.style : true;
    const levelOk = filter.level ? level === filter.level : true;
    const teacherOk = filter.teacher ? teacher === filter.teacher : true;
    const dayOk = filter.day ? String(day).startsWith(filter.day) : true;
    return textMatch && styleOk && levelOk && teacherOk && dayOk;
  };
}

function Toolbar({ view, setView, showFavoritesOnly, setShowFavoritesOnly }) {
  const Btn = ({ v, label }) => (
    React.createElement('button', {
      className: `seg-btn ${view === v ? 'active' : ''}`,
      onClick: () => setView(v)
    }, label)
  );
  return React.createElement('div', { className: 'react-toolbar' },
    React.createElement('div', { className: 'segmented' },
      React.createElement(Btn, { v: 'cards', label: 'Kortit' }),
      React.createElement(Btn, { v: 'schedule', label: 'Aikataulu' }),
    ),
    React.createElement('label', { className: 'fav-toggle' },
      React.createElement('input', {
        type: 'checkbox',
        checked: showFavoritesOnly,
        onChange: (e) => setShowFavoritesOnly(e.target.checked)
      }), ' Vain suosikit'
    )
  );
}

function FilterBar({ styles, levels, teachers, days, filter, setFilter, onReset }) {
  const Control = ({ label, children }) => (
    React.createElement('label', { className: 'rf-control' },
      React.createElement('span', { className: 'rf-label' }, label),
      children
    )
  );
  return (
    React.createElement('div', { className: 'react-filter' },
      React.createElement(Control, { label: 'Haku' },
        React.createElement('input', {
          type: 'search', placeholder: 'Etsi kurssia, lajia, tasoa...', value: filter.q,
          onChange: (e) => setFilter((f) => ({ ...f, q: e.target.value }))
        })
      ),
      React.createElement(Control, { label: 'Laji' },
        React.createElement('select', {
          value: filter.style, onChange: (e) => setFilter((f) => ({ ...f, style: e.target.value }))
        }, React.createElement('option', { value: '' }, 'Kaikki'), ...styles.map((s) => React.createElement('option', { key: s, value: s }, s)))
      ),
      React.createElement(Control, { label: 'Taso' },
        React.createElement('select', {
          value: filter.level, onChange: (e) => setFilter((f) => ({ ...f, level: e.target.value }))
        }, React.createElement('option', { value: '' }, 'Kaikki'), ...levels.map((s) => React.createElement('option', { key: s, value: s }, s)))
      ),
      React.createElement(Control, { label: 'Opettaja' },
        React.createElement('select', {
          value: filter.teacher, onChange: (e) => setFilter((f) => ({ ...f, teacher: e.target.value }))
        }, React.createElement('option', { value: '' }, 'Kaikki'), ...teachers.map((s) => React.createElement('option', { key: s, value: s }, s)))
      ),
      React.createElement(Control, { label: 'Päivä' },
        React.createElement('select', {
          value: filter.day, onChange: (e) => setFilter((f) => ({ ...f, day: e.target.value }))
        }, React.createElement('option', { value: '' }, 'Kaikki'), ...days.map((s) => React.createElement('option', { key: s, value: s }, s)))
      ),
      React.createElement('button', { className: 'btn rf-reset', onClick: onReset }, 'Tyhjennä')
    )
  );
}

function makeICS(course) {
  // Create a simple ICS file for next occurrence on the upcoming weekday
  const now = new Date();
  // Map FI day to 1..7 (Mon..Sun) like DAY_INDEX
  const dow = DAY_INDEX[course.day.slice(0,2)] || 1;
  const todayDow = ((now.getDay() + 6) % 7) + 1; // JS 0=Sun -> 7
  let delta = dow - todayDow; if (delta < 0) delta += 7;
  const { start, end } = parseTimeRange(course.time) || { start: 18*60, end: 19*60 };
  const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + delta, Math.floor(start/60), start%60);
  const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + delta, Math.floor(end/60), end%60);
  const fmt = (d) => d.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/, 'Z');
  const desc = [
    `Opettaja: ${course.teacher}`,
    `Päivä: ${course.day}`,
    `Aika: ${course.time}`,
  ];
  if (course.price) desc.push(`Hinta: ${course.price}`);
  const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Move It Tanssiopisto//Courses//FI\nBEGIN:VEVENT\nUID:${courseId(course)}@move-it\nDTSTAMP:${fmt(new Date())}\nDTSTART:${fmt(startDate)}\nDTEND:${fmt(endDate)}\nSUMMARY:${course.name} (${course.style} - ${course.level})\nLOCATION:${course.room}\nDESCRIPTION:${desc.join('\\n')}\nEND:VEVENT\nEND:VCALENDAR`;
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `${course.name}-${course.day}.ics`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function CardsView({ rows, favorites, toggleFavorite }) {
  return React.createElement('div', { className: 'course-cards' },
    ...rows.map((c) => React.createElement('div', { key: courseId(c), className: 'course-card' },
      React.createElement('div', { className: 'cc-header' },
        React.createElement('span', { className: 'cc-style' }, c.style),
        React.createElement('button', {
          className: `cc-fav ${favorites.has(courseId(c)) ? 'active' : ''}`,
          title: 'Lisää suosikkeihin',
          onClick: () => toggleFavorite(c)
        }, '★')
      ),
      React.createElement('h3', { className: 'cc-title' }, c.name, ' — ', c.level),
      React.createElement('div', { className: 'cc-meta' }, `${c.teacher} • ${c.day} ${c.time} • ${c.room}`),
      React.createElement('div', { className: 'cc-footer' },
        React.createElement('button', { className: 'btn', onClick: () => makeICS(c) }, 'Kalenteriin')
      )
    ))
  );
}

function ScheduleView({ rows }) {
  // Define time range
  const parsed = rows.map((r) => ({ ...r, range: parseTimeRange(r.time), dayIndex: DAY_INDEX[r.day.slice(0,2)] || 1 }));
  const valid = parsed.filter((r) => r.range);
  const minStart = Math.min( ...valid.map((r)=>r.range.start), 16*60 );
  const maxEnd = Math.max( ...valid.map((r)=>r.range.end), 22*60 );
  const total = maxEnd - minStart;
  const days = ['Ma','Ti','Ke','To','Pe','La','Su'];

  return React.createElement('div', { className: 'schedule' },
    React.createElement('div', { className: 'sch-header' },
      React.createElement('div', { className: 'sch-timecol' }),
      ...days.map((d) => React.createElement('div', { key: d, className: 'sch-day' }, d))
    ),
    React.createElement('div', { className: 'sch-body' },
      React.createElement('div', { className: 'sch-timecol' },
        ...Array.from({ length: Math.ceil((maxEnd - minStart)/60)+1 }).map((_,i)=>{
          const h = Math.floor((minStart/60)+i);
          return React.createElement('div', { key: i, className: 'sch-hour' }, `${h.toString().padStart(2,'0')}:00`)
        })
      ),
      ...days.map((d, idx) => React.createElement('div', { key: d, className: 'sch-daycol' },
        ...valid.filter((r)=>r.dayIndex===idx+1).map((r)=>{
          const top = ((r.range.start - minStart)/total)*100;
          const height = ((r.range.end - r.range.start)/total)*100;
          return React.createElement('div', { key: courseId(r), className: 'sch-block', style: { top: `${top}%`, height: `${height}%` } },
            React.createElement('div', { className: 'sch-title' }, r.name),
            React.createElement('div', { className: 'sch-meta' }, `${r.level} • ${r.teacher}`)
          );
        })
      ))
    )
  );
}

function CourseUI() {
  const { rows, styles, levels, teachers, days } = useMemo(() => scanCourses(), []);
  const [filter, setFilter] = useState({ q: '', style: '', level: '', teacher: '', day: '' });
  const [view, setView] = useState('cards');
  const [favorites, setFavorites] = useState(()=>{
    try { return new Set(JSON.parse(localStorage.getItem('favorites')||'[]')); } catch { return new Set(); }
  });
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Hide original tables and headers permanently; Cards/Schedule are the primary views
  useEffect(() => {
    const els = document.querySelectorAll('.kurssit-lista table, .kurssit-lista h2');
    els.forEach(el => el.style.display = 'none');
    return () => { els.forEach(el => el.style.display = ''); };
  }, []);

  const allFiltered = useMemo(()=> rows.filter(filterPredicate(filter)), [rows, filter]);
  const visibleRows = useMemo(()=> {
    const base = showFavoritesOnly ? allFiltered.filter(r => favorites.has(courseId(r))) : allFiltered;
    // Group by style consistently using the original order of styles
    const styleIndex = (s) => Math.max(0, styles.indexOf(s));
    return [...base].sort((a,b)=> styleIndex(a.style) - styleIndex(b.style));
  }, [allFiltered, showFavoritesOnly, favorites, styles]);

  const toggleFavorite = (c) => {
    setFavorites(prev => {
      const id = courseId(c);
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      localStorage.setItem('favorites', JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const onReset = () => setFilter({ q: '', style: '', level: '', teacher: '', day: '' });

  return (
    React.createElement(React.Fragment, null,
      React.createElement(Toolbar, { view, setView, showFavoritesOnly, setShowFavoritesOnly }),
      React.createElement(FilterBar, { styles, levels, teachers, days, filter, setFilter, onReset }),
      view === 'cards' ? React.createElement(CardsView, { rows: visibleRows, favorites, toggleFavorite })
        : React.createElement(ScheduleView, { rows: visibleRows })
    )
  );
}

function mountCourseFilter() {
  const host = document.getElementById('course-filter-root');
  if (!host) return;
  const root = createRoot(host);
  root.render(React.createElement(CourseUI));
}

// ---------- Home page widget: Next Up ----------
function parseEmbeddedCourses() {
  const el = document.getElementById('course-data');
  if (!el) return [];
  try {
    const json = JSON.parse(el.textContent || '{}');
    return json.courses || [];
  } catch { return []; }
}

function getTodayIndex() {
  // Convert JS getDay() to our 1..7 mapping (Mon..Sun)
  const js = new Date().getDay(); // 0..6, Sun..Sat
  return js === 0 ? 7 : js; // Sun -> 7
}

function nextClassesToday(courses, limit = 3) {
  const today = getTodayIndex();
  const now = new Date();
  const minsNow = now.getHours() * 60 + now.getMinutes();
  return courses
    .map(c => ({ ...c, dayIndex: DAY_INDEX[c.day?.slice(0,2)] || 0, range: parseTimeRange(c.time) }))
    .filter(c => c.dayIndex === today && c.range)
    .filter(c => c.range.end > minsNow)
    .sort((a,b) => a.range.start - b.range.start)
    .slice(0, limit);
}

function NextUp() {
  const [courses] = useState(() => parseEmbeddedCourses());
  const items = useMemo(() => nextClassesToday(courses, 3), [courses]);

  if (!items.length) {
    return React.createElement('div', { className: 'next-none' }, 'Ei tunteja tänään – katso koko aikataulu sivulta Kurssit.');
  }

  return React.createElement('div', { className: 'next-cards' },
    ...items.map((c) => React.createElement('div', { key: courseId(c), className: 'next-card' },
      React.createElement('div', { className: 'next-time' }, `${c.day} ${c.time}`),
      React.createElement('div', { className: 'next-title' }, `${c.style}: ${c.name} — ${c.level}`),
      React.createElement('div', { className: 'next-meta' }, `${c.teacher} • ${c.room}`),
      React.createElement('div', { className: 'next-actions' },
        React.createElement('a', { href: 'kurssit.html', className: 'btn' }, 'Ilmoittaudu')
      )
    ))
  );
}

function mountNextUp() {
  const host = document.getElementById('next-up-root');
  if (!host) return;
  const root = createRoot(host);
  root.render(React.createElement(NextUp));
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { mountCourseFilter(); mountNextUp(); });
} else {
  mountCourseFilter();
  mountNextUp();
}
