// Keep the best total score locally, with the game still working if storage is unavailable.
export function saveBest(score){try{localStorage.setItem('pong.best',String(Math.max(Number(localStorage.getItem('pong.best'))||0,score)));}catch{}}
