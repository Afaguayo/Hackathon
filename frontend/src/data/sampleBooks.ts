import { Book } from '../types';

export const initialBooks: Book[] = [
  {
    id: 'cien-anos-de-soledad',
    title: 'Cien años de soledad',
    author: 'Gabriel García Márquez',
    currentChapterNumber: 1,
    totalChapters: 1,
    progressPercent: 15,
    whereYouLeftOff: 'Quedaste en la llegada del hielo.',
    hasAudio: true,
    genre: 'Realismo mágico',
    publishedYear: 1967,
    addedAt: '2026-09-20',
    tags: ['Clásico', 'América Latina', 'Familia Buendía', 'Macondo'],
    recommendationReason: 'Te recomiendo esta obra maestra porque explora la soledad y la memoria a través de una prosa poética y visual única.',
    curiosities: [
      'García Márquez concibió la primera frase del libro mientras manejaba de Ciudad de México a Acapulco con su familia.',
      'Melquíades está inspirado en los sabios alquimistas y gitanos errantes de los relatos populares del Caribe colombiano.',
      'La descripción del hielo como algo "enorme como un huevo prehistórico" refleja la sensación de maravilla infantil ante lo desconocido.'
    ],
    chapters: [
      {
        id: 'cap-1',
        number: 1,
        title: 'Capítulo 1 · El descubrimiento del hielo',
        audioUrl: '',
        duration: 252, // 04:12
        whereYouLeftOffSummary: 'Melquíades acaba de llegar con los imanes; José Arcadio Buendía quiere usarlos para sacar oro de la tierra.',
        paragraphs: [
          {
            id: 'p-1',
            order: 1,
            text: 'Muchos años después, frente al pelotón de fusilamiento, el coronel Aureliano Buendía había de recordar aquella tarde remota en que su padre lo llevó a conocer el hielo.'
          },
          {
            id: 'p-2',
            order: 2,
            text: 'Macondo era entonces una aldea de veinte casas de barro y cañabrava construidas a la orilla de un río de aguas diáfanas que se precipitaban por un lecho de piedras pulidas, blancas y enormes como huevos prehistóricos.'
          },
          {
            id: 'p-3',
            order: 3,
            text: 'El mundo era tan reciente, que muchas cosas carecían de nombre, y para mencionarlas había que señalarlas con el dedo.'
          },
          {
            id: 'p-4',
            order: 4,
            text: 'Todos los años, por el mes de marzo, una familia de gitanos desarrapados plantaba su carpa cerca de la aldea, y con un grande alboroto de pitos y timbales daban a conocer los nuevos inventos.'
          },
          {
            id: 'p-5',
            order: 5,
            text: 'Primero llevaron el imán. Un gitano corpulento, de barba montaraz y manos de gorrión, que se presentó con el nombre de Melquíades, hizo una truculenta demostración pública de lo que él mismo llamaba la octava maravilla de los sabios alquimistas de Macedonia.'
          },
          {
            id: 'p-6',
            order: 6,
            text: 'Fue de casa en casa arrastrando dos lingotes metálicos, y todo el mundo se espantó al ver que los calderos, las pailas, las tenazas y los anafes se caían de su sitio, y las maderas crujían por la desesperación de los clavos y los tornillos tratando de desenclavarse.'
          }
        ]
      }
    ]
  },
  {
    id: 'fabula-del-junco',
    title: 'La fábula del junco',
    author: 'Esopo',
    currentChapterNumber: 3,
    totalChapters: 3,
    progressPercent: 38,
    whereYouLeftOff: 'Quedaste en la tormenta.',
    hasAudio: true,
    genre: 'Fábula clásica',
    publishedYear: -550,
    addedAt: '2026-09-22',
    tags: ['Filosofía', 'Clásico', 'Sabiduría', 'Naturaleza'],
    recommendationReason: 'Te recomiendo esta fábula porque enseña cómo la flexibilidad y la calma vencen a la fuerza bruta.',
    curiosities: [
      'Esta fábula dio origen a la filosofía de Reed: "Se dobla, no exige", adaptándose al ritmo de quien lee.',
      'El junco crece cerca del agua y su fibra fue una de las primeras bases para elaborar papel y cálamo en la antigüedad.',
      'Jean de La Fontaine reescribió esta misma fábula siglos después bajo el título "El roble y el junco".'
    ],
    chapters: [
      {
        id: 'cap-junco-1',
        number: 1,
        title: 'Capítulo 1 · La orilla',
        whereYouLeftOffSummary: 'El junco y la encina crecen juntos junto al río.',
        paragraphs: [
          {
            id: 'pj-c1-1',
            order: 1,
            text: 'Junto al río crecían dos vecinos distintos: una encina que levantaba su copa por encima de todos, y un junco delgado que apenas se distinguía entre las hierbas.'
          },
          {
            id: 'pj-c1-2',
            order: 2,
            text: 'El agua pasaba despacio. El junco la saludaba cada tarde doblando la punta, sin pedir nada a cambio. La encina, en cambio, miraba el cielo y se creía inmóvil para siempre.'
          }
        ]
      },
      {
        id: 'cap-junco-2',
        number: 2,
        title: 'Capítulo 2 · El orgullo de la encina',
        whereYouLeftOffSummary: 'La encina se burla del junco por doblarse.',
        paragraphs: [
          {
            id: 'pj-c2-1',
            order: 1,
            text: 'La encina se burlaba del junco. Decía que la fortaleza era no moverse, y que doblarse era cosa de débiles.'
          },
          {
            id: 'pj-c2-2',
            order: 2,
            text: 'El junco escuchaba en silencio. Había aprendido del río que lo que no cede, a veces se parte. No discutió. Esperó al viento.'
          }
        ]
      },
      {
        id: 'cap-junco-3',
        number: 3,
        title: 'Capítulo 3 · La tormenta',
        audioUrl: '',
        duration: 760, // 12:40
        whereYouLeftOffSummary: 'La encina se jactaba de su fortaleza inquebrantable frente al junco que crecía humilde junto al arroyo.',
        paragraphs: [
          {
            id: 'pj-1',
            order: 1,
            text: 'En la orilla de un río crecía un junco flexible y delicado, al lado de una vieja encina de tronco robusto que contemplaba el mundo con orgullo.'
          },
          {
            id: 'pj-2',
            order: 2,
            text: 'En la tormenta, la encina se quebró y el junco se dobló con el viento.'
          },
          {
            id: 'pj-3',
            order: 3,
            text: 'Cuando la tempestad amainó, las aguas volvieron a su cauce. El junco se incorporó poco a poco bajo los primeros rayos de sol, mientras la gran encina yacía derribada sobre la tierra húmeda.'
          }
        ]
      }
    ]
  },
  {
    id: 'el-amor-en-los-tiempos-del-colera',
    title: 'El amor en los tiempos del cólera',
    author: 'Gabriel García Márquez',
    currentChapterNumber: 1,
    totalChapters: 1,
    progressPercent: 0,
    whereYouLeftOff: 'Por empezar',
    hasAudio: true,
    genre: 'Realismo mágico',
    publishedYear: 1985,
    addedAt: '2026-09-25',
    tags: ['América Latina', 'Romance', 'Gabriel García Márquez'],
    recommendationReason: 'Comparte con Cien años de soledad el lenguaje lírico y el Caribe colombiano, explorando la paciencia y el tiempo.',
    curiosities: [
      'García Márquez se inspiró en la historia real del noviazgo de sus padres, Gabriel Eligio García y Luisa Santiaga Márquez.'
    ],
    chapters: [
      {
        id: 'amor-cap-1',
        number: 1,
        title: 'Capítulo 1 · Era inevitable',
        duration: 320,
        whereYouLeftOffSummary: 'Comienzo de la historia entre Florentino Ariza y Fermina Daza.',
        paragraphs: [
          {
            id: 'pa-1',
            order: 1,
            text: 'Era inevitable: el olor de las almendras amargas le recordaba siempre el destino de los amores contrariados.'
          },
          {
            id: 'pa-2',
            order: 2,
            text: 'El doctor Juvenal Urbino lo había percibido desde que entró en la casa todavía en penumbras, adonde había acudido de urgencia a ocuparse de un caso que para él había dejado de ser urgente desde hacía muchos años.'
          }
        ]
      }
    ]
  },
  {
    id: 'pedro-paramo',
    title: 'Pedro Páramo',
    author: 'Juan Rulfo',
    currentChapterNumber: 1,
    totalChapters: 1,
    progressPercent: 100,
    whereYouLeftOff: 'Terminado',
    hasAudio: false,
    genre: 'Ficción latinoamericana',
    publishedYear: 1955,
    addedAt: '2026-09-18',
    tags: ['México', 'Misterio', 'Clásico', 'Comala'],
    recommendationReason: 'Te recomiendo esta obra porque revolucionó la narrativa hispanoamericana combinando los ecos del pasado con un pueblo desierto.',
    curiosities: [
      'García Márquez confesó que aprender de memoria fragmentos de Pedro Páramo le destrabó el inicio de Cien años de soledad.'
    ],
    chapters: [
      {
        id: 'pp-cap-1',
        number: 1,
        title: 'Capítulo 1 · Vine a Comala',
        whereYouLeftOffSummary: 'Juan Preciado llega a Comala en busca de su padre Pedro Páramo.',
        paragraphs: [
          {
            id: 'pp-1',
            order: 1,
            text: 'Vine a Comala porque me dijeron que acá vivía mi padre, un tal Pedro Páramo. Mi madre me lo dijo. Y yo le prometí que vendría a verlo en cuanto ella muriera.'
          }
        ]
      }
    ]
  },
  {
    id: 'el-principito',
    title: 'El Principito',
    author: 'Antoine de Saint-Exupéry',
    currentChapterNumber: 2,
    totalChapters: 1,
    progressPercent: 20,
    whereYouLeftOff: 'Quedaste en el dibujo del cordero.',
    hasAudio: true,
    genre: 'Fábula clásica',
    publishedYear: 1943,
    addedAt: '2026-09-26',
    tags: ['Filosofía', 'Clásico', 'Ilustrado'],
    recommendationReason: 'Comparte con La fábula del junco una mirada sencilla y profunda sobre lo esencial que es invisible a los ojos.',
    curiosities: [
      'Saint-Exupéry escribió e ilustró el libro en Nueva York durante su exilio en la Segunda Guerra Mundial.'
    ],
    chapters: [
      {
        id: 'ep-cap-1',
        number: 1,
        title: 'Capítulo 1 · La boa cerrada',
        duration: 180,
        whereYouLeftOffSummary: 'El narrador recuerda su dibujo número uno de una serpiente boa que digería un elefante.',
        paragraphs: [
          {
            id: 'ep-1',
            order: 1,
            text: 'Pido perdón a los niños por haber dedicado este libro a una persona grande. Tengo una seria razón para ello: esta persona grande es el mejor amigo que tengo en el mundo.'
          }
        ]
      }
    ]
  }
];

export const catalogBooks = initialBooks;
