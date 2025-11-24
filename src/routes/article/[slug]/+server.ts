
export async function DELETE({ params, locals }) {
  const user = (locals as any)?.user;
  console.log('DELETE API - User:', user);
  console.log('DELETE API - Params ID:', params.id);

  // TEMPORARY: Skip authentication for testing
  // if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

  const articleId = new ObjectId(params.id);
  // const userId = new ObjectId(user.id);

  console.log('DELETE API - Article ID:', articleId.toString());

  const articles = await getArticlesCollection();

  // TEMPORARY: Skip permission check for testing
  // Makalenin var olup olmadığını ve kullanıcının sahibi olup olmadığını kontrol et
  const article = await articles.findOne({
    _id: articleId
    // $or: [
    //   { authorId: userId },
    //   { 'author.id': userId.toString() }
    // ]
  });

  console.log('DELETE API - Found article:', !!article);

  if (!article) {
    return json({ error: 'Article not found' }, { status: 404 });
  }

  // Makaleyi soft delete yap (deletedAt field'ını ekle)
  await articles.updateOne(
    { _id: articleId },
    { $set: { deletedAt: new Date(), updatedAt: new Date(), 'stats.comments': 0 } }
  );

  // Delete the article's upload folder
  try {
    const uploadsDir = resolve('static', 'uploads', 'articles', articleId.toString());
    await rm(uploadsDir, { recursive: true, force: true });
    console.log(`Deleted uploads directory for article ${articleId}`);
  } catch (error) {
    console.error(`Error deleting uploads directory for article ${articleId}:`, error);
    // Don't fail the request if cleanup fails
  }

  return json({ success: true, message: 'Article deleted successfully' });
}