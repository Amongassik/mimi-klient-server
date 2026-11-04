document.querySelectorAll('.menu-item').forEach(item=>{
    item.addEventListener('click',(e)=>{
        if(e.target.closest('.sub-menu a'))return

        document.querySelectorAll('.menu-item.open').forEach(other => {
            if (other !== item) other.classList.remove('open')
        })

        item.classList.toggle('open')
    })
})

document.addEventListener('click', (e) => {
  if (e.target.closest('.menu-item')) return
  document.querySelectorAll('.menu-item.open').forEach(i => i.classList.remove('open'))
})

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.menu-item.open').forEach(i => i.classList.remove('open'))
  }
})