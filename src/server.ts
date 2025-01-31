import { PrismaClient } from "@prisma/client";
import express from "express";
import swaggerUi from "swagger-ui-express";
import swaggerDocument from "../swagger.json";

const port = 3000;
const app = express();
const prisma = new PrismaClient();

app.use(express.json());
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument))

app.get("/movies", async (_, res) => {
    const movies = await prisma.movie.findMany({
        orderBy: {
            title: "asc",
        },
        include: {
            genres: true,
            languages: true
        }
    });
    res.json(movies);
});

app.post("/movies", async (req, res) => {

    const { title, genre_id, language_id, oscar_count, release_date } = req.body;

    try {

        const movieWithSameTitle = await prisma.movie.findFirst({
            where: { title: { equals: title, mode: "insensitive" } },
        })

        if (movieWithSameTitle) {
            return res.status(409).send({ message: "Já existe um filme com esse título" });
        }

        await prisma.movie.create({
            data: {
                title,
                genre_id,
                language_id,
                oscar_count,
                release_date: new Date(release_date),
            }
        });

        res.status(201).send();
    } catch (error) {
        return res.status(500).send({ message: "Falha ao cadastrar o filme" })
    }

});

app.put("/movies/:id", async (req, res) => {
    //Pegar o ID do registro que vai ser atualizado;
    const id = Number(req.params.id);

    try {
        const movie = await prisma.movie.findUnique({
            where: {
                id
            }
        });

        if (!movie) {
            return res.status(404).send({ message: "O filme não foi encontrado" })
        }

        const data = { ...req.body }; // aqui ele dá um sprad ou seja pegar todos os valores que o body mandar

        data.release_date = data.release_date ? new Date(data.release_date) : undefined; //Faz a verificação se o body enviou uma nova data ou não

        //Pegar os dados do filme que será atualizado e atualizar ele no prisma
        await prisma.movie.update({
            where: {
                id //pega o ID 
            },
            data: data // atualiza quaisquer informações, desde que, seja informações que já estejam no banco.
        });
    } catch (error) {
        return res.status(500).send({ message: "Falha ao atualizar o registro" });
    }

    //Retornar o status correto informando que o filme foi atualizado.
    res.status(200).send({ message: "Filme atualizado com sucesso" })
})

app.delete('/movies/:id', async (req, res) => {
    const id = Number(req.params.id);

    try {
        const movie = await prisma.movie.findUnique({
            where: { id }
        })

        if (!movie) {
            return res.status(404).send({ message: 'Filme não encontrado' });
        }

        await prisma.movie.delete({ where: { id } });

    } catch (error) {
        res.status(500).send({ message: 'Falha ao remover o registro' });
    }

    res.status(200).send({ message: 'Filme removido com sucesso' });
});

app.get("/movies/:genreName", async (req, res) => {
    try {
        const moviesFilteredByGenreName = await prisma.movie.findMany({
            include: {
                genres: true,
                languages: true
            }, // O includes faz com que os gêneros e as linguagens não sejam mostradas apenas com o ID e sim com o nome respectivo ao filme

            where: {
                genres: {
                    name: {
                        equals: req.params.genreName, //busca o nome exatamente igual ao que foi digitado
                        mode: 'insensitive'
                    }
                }
            }
        });

        res.status(200).send(moviesFilteredByGenreName)
    } catch(error){
        res.status(500).send({ message: 'Falha ao filtar o filme' });
    }
});

//Atualizando informações de um gênero
app.put("/genres/:id", async (req, res) => {
    const id = Number(req.params.id);
    const { name } = req.body;

    try{
        const genre = await prisma.genre.findUnique({
            where: {
                id
            },
        });

        if (!genre) {
            return res.status(404).send({ message: "O gênero não foi encontrado" })
        }

        const existingGenre = await prisma.genre.findFirst({
            where: { 
                name: { equals: name, mode: "insensitive" },
                id: { not: Number(id) } 
            },
        });

        if(existingGenre){
            return res.status(409).send({ message: "Este nome de gênero já existe." });
        }

        await prisma.genre.update({
            where: { id },
            data: {name}
        });

        res.status(200).send({message: "Gênero atualizado com sucesso"})
    } catch{
        res.status(500).send({ message: 'Falha ao alterar o gênero.' });
    }
});

//Adicionando um novo gênero
app.post("/genres", async (req, res) => {
    const { name } = req.body
    console.log(name)

    if(!name) {
        return res.status(400).send({ message: "O nome do gênero é obrigatório." });
    }

    try{
        const checkingExistingGenre = await prisma.genre.findFirst({
            where: { name: { equals: name, mode: "insensitive"} },
        })

        if (checkingExistingGenre) {
            return res.status(409).send({ message: "Já existe esse gênero" });
        }

        await prisma.genre.create({
            data: {
                name
            }
        })

        res.status(200).send({message: 'Gênero adicionado com sucesso'})

    } catch {
        res.status(500).send({ message: 'Falha ao adicionar um novo gênero.' });
    }
});

//Listando todos os gêneros
app.get("/genres", async (req, res) => {
    try{
        const genres = await prisma.genre.findMany({
            orderBy: {
                name: "asc",
            }
        })
        res.json(genres);

    } catch {
        res.status(500).send({ message: 'Falha ao listar os gêneros.' });
    }
});

//Deletando Gênero
app.delete("/genres/:id", async (req, res) => {
    const id = Number(req.params.id);

    try{
        const genres = await prisma.genre.findUnique({
            where: { id }
        })

        if (!genres) {
            return res.status(404).send({ message: 'Gênero não encontrado' });
        }

        await prisma.genre.delete({ where: { id } });

        res.status(200).send({ message: "Gênero removido com sucesso." });
    } catch {
        res.status(500).send({ message: 'Falha ao remover o gênero.' });
    }
})

app.listen(port, () => {
    console.log(`Servidor em execução na porta ${port}`);
});