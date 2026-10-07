// The person behind CASEFILE. Shown at the bottom of the landing page.
// To add the photo: put it at public/creator/<file> and set `photo` to "/creator/<file>".

export const creator = {
  name: "Mohammad Saad",
  credit: "Created and designed by Mohammad Saad",
  // Cropped to 4:5 from the top, which is the shape the pinned photo-print renders.
  photo: "/creator/portrait.webp" as string | null,
  greeting: "Hey, fellow developer — and fellow gamer.",
  paragraphs: [
    "I grew up watching movies, playing games, and getting completely fascinated by stories where one tiny clue could change everything. Games like L.A. Noire and Criminal Case, along with stories like Sherlock Holmes, made me fall in love with the world of investigation, mystery, and deduction.",
    "CASEFILE is my take on that feeling. I wanted to build something where you don't just play a detective — you actually have to think like one. Follow the clues, question the evidence, connect the dots, challenge your theories, and hopefully uncover the truth before it disappears.",
    "So whether you're here because you love detective stories, games, or just a good mystery...",
  ],
  closing: "Welcome to CASEFILE. Your investigation starts now.",
};
