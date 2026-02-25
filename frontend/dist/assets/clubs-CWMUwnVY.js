import{A as t}from"./config-B_CD02Rf.js";let o=null;try{const e=localStorage.getItem("user");if(!e)throw new Error("No hay sesión");const r=JSON.parse(e);o=r.user?r.user.id:r.id}catch{throw window.location.href="index.html",new Error("Redirecting to login...")}let a=[];async function c(){toggleSpinner(!0);try{await l(),await d()}finally{toggleSpinner(!1)}}async function l(){try{const r=await(await fetch(`${t}/api/clubs/mis-clubes/${o}`)).json(),n=document.getElementById("mis-clubes-container");if(n.innerHTML="",r.length===0){n.innerHTML='<p style="color:#777">Aún no te has unido a ningún club.</p>';return}r.forEach(s=>{a.push(s.id),n.innerHTML+=`
                        <div class="card club-card">
                            <div>
                                <h3>${s.name}</h3>
                                <p>${s.description}</p>
                            </div>
                            <div class="badge-member">✓ Eres Miembro</div>
                        </div>
                    `})}catch{mostrarToast("Error al cargar mis clubes","error")}}async function d(){try{const r=await(await fetch(`${t}/api/clubs`)).json(),n=document.getElementById("todos-clubes-container");n.innerHTML="";let s=!1;r.forEach(i=>{a.includes(i.id)||(s=!0,n.innerHTML+=`
                        <div class="card club-card">
                            <div>
                                <h3>${i.name}</h3>
                                <p>${i.description}</p>
                            </div>
                            <button class="btn-primary" onclick="unirse(${i.id}, '${i.name}')">
                                Unirse al Club
                            </button>
                        </div>
                    `)}),s||(n.innerHTML='<p style="color:#777">¡Ya estás unido a todos los clubes disponibles! 🏆</p>')}catch{mostrarToast("Error al cargar clubes disponibles","error")}}c();
