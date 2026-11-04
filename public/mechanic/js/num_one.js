
const solveButton = document.getElementById('solve-btn')

const methodsInputs = document.querySelectorAll('.radio')

const hRange = document.getElementById('h-value-display')

const toast = {
    element: document.getElementById('toast'),
    messageEl: document.getElementById('toast-message'),
    closeBtn: document.getElementById('toast-close'),
    timeoutId: null,

    show: function(message, type = 'info') {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
        }

        this.messageEl.textContent = message;

        this.element.classList.remove('toast-error');
        if (type === 'error') {
            this.element.classList.add('toast-error');
        }

        this.element.classList.add('show');

        this.timeoutId = setTimeout(() => {
            this.hide();
        }, 5000);
    },

    hide: function() {
        this.element.classList.remove('show');
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
    }
};

const Method = {
    method: null,
    methods: ['mkr','mke'],
    getMethod(id){
        this.method = this.methods.at(id)
    },
    notNull(){
        return Boolean(this.method)
    }
}



function getMethod(){
    const selectedInput = [...methodsInputs].find(inp => inp.checked);

    if (!selectedInput) {
        toast.show('Метод не выбран', 'error');
        return false;
    }

    const id = Number(selectedInput.id);
    
    Method.getMethod(id);

    if(!Method.notNull()){
        toast.show('Неизвестный метод', 'error');
        return false;
    }

    return true;
}

async function solve(){
    if (!getMethod()) return;

    const h = +hRange.textContent
    toast.show('Решаем...')

    const data =  {
        method: Method.method,
        step: h,
    }
    try{
        const res = await fetch('/api/mechanick/sde',{
          method: 'POST',
          headers:{
            'Content-Type':'application/json'
          },
          body:JSON.stringify(data),
        })

        if(!res.ok){
            const err = await res.json().catch(()=>{})
            toast.show(`Сервер вернул ${res.status}`,'error')
        }

        const result = await res.json()
        console.log(result)
    }catch(e){
        console.log(e.message)
        return
    }
}

solveButton.addEventListener('click', solve)


