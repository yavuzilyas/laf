import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function generateEvents() {
    const client = await pool.connect();
    
    try {
        console.log('100 adet rastgele event/duyuru oluşturuluyor...');
        
        const cities = ['İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Adana', 'Konya', 'Gaziantep'];
        const categories = ['Seminer', 'Konferans', 'Workshop', 'Duyuru', 'Panel', 'Söyleşi'];
        
        let inserted = 0;
        
        for (let i = 1; i <= 100; i++) {
            const type = i % 2 === 0 ? 'event' : 'announcement';
            const city = cities[Math.floor(Math.random() * cities.length)];
            const category = categories[Math.floor(Math.random() * categories.length)];
            const date = new Date();
            date.setDate(date.getDate() + Math.floor(Math.random() * 30));
            const endDate = new Date(date);
            endDate.setHours(endDate.getHours() + 2);
            const attendeeCount = Math.floor(Math.random() * 100);
            
            await client.query(`
                INSERT INTO events (title, description, date, end_date, city, location, type, category, is_active, attendee_count)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            `, [
                'a',
                'a',
                date,
                endDate,
                city,
                'a',
                type,
                category,
                true,
                attendeeCount
            ]);
            
            inserted++;
            if (inserted % 10 === 0) {
                console.log(`${inserted} kayıt eklendi...`);
            }
        }
        
        console.log(`\n✅ Toplam ${inserted} adet event/duyuru başarıyla oluşturuldu!`);
        
        // Sayıları göster
        const result = await client.query(`
            SELECT type, COUNT(*) as count 
            FROM events 
            GROUP BY type
        `);
        
        console.log('\nÖzet:');
        for (const row of result.rows) {
            console.log(`  - ${row.type}: ${row.count} adet`);
        }
        
    } catch (error) {
        console.error('Hata:', error);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

generateEvents();
