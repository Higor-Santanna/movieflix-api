import { PrismaClient } from "@prisma/client";
import express from "express";

const port = 3000;
const app = express();
const prisma = new PrismaClient();

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

app.use(express.json());

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
})

app.listen(port, () => {
    console.log(`Servidor em execução na porta ${port}`);
});