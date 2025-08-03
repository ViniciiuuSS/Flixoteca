# 🎬 Flixoteca - **[Flixoteca](https://flixoteca.onrender.com/)** 

**Flixoteca** é um catálogo de filmes construído com **Blazor WebAssembly (C#)**, que consome imagens da API pública da TMDB e utiliza **Flowbite** e **PNotify** para criar uma interface moderna e responsiva. Os dados são armazenados localmente em um arquivo `.json`, permitindo navegação offline após o carregamento inicial.

---

## 🛠️ Tecnologias Utilizadas

- **[Blazor WebAssembly](https://dotnet.microsoft.com/en-us/apps/aspnet/web-apps/blazor)** (.NET)
- **C#** (Frontend SPA com Razor)
- **[Flowbite](https://flowbite.com/)** – UI moderna com Tailwind CSS
- **[PNotify](https://sciactive.com/pnotify/)** – Notificações interativas
- **API da TMDB** – Para imagens dos filmes
- **Sistema de armazenamento local com `.json`**

---

## ⚙️ Funcionalidades

- 🔍 Pesquisa e exibição de pôsteres de filmes
- 💾 Armazenamento local em `filmes.json` para cache offline
- 🧠 Leitura automática do JSON se já existir dados
- 📦 Integração com a API de imagens da [TMDB](https://image.tmdb.org/t/p/w300)
- 🔔 Notificações modernas com PNotify
- 🎨 UI responsiva com Flowbite + Tailwind

## 🔌 Integração com TMDB

A aplicação usa imagens públicas da API de imagens do TMDB, **sem necessidade de autenticação**:

```csharp
var imageUrl = $"https://image.tmdb.org/t/p/w300/{posterPath}";
